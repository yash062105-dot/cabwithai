import { useState, useEffect, useCallback } from 'react'
import { adminService } from '../../services/adminService'
import type { RevenueData } from '../../types'
import { PageHeader } from '../../components/common/PageHeader'
import { Notice } from '../../components/ui/Notice'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatMoney } from '../../utils/formatters'
import {
  RotateCcw,
  BarChart3,
  Car,
  UserCheck,
} from 'lucide-react'

export function RevenuePage() {
  const [period, setPeriod] = useState('day')
  const [data, setData] = useState<RevenueData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)

  const load = useCallback(async () => {
    try {
      const res = await adminService.getRevenue(period)
      setData(res)
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Revenue data could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    const timer = window.setTimeout(load, 0)
    return () => window.clearTimeout(timer)
  }, [load, refresh])

  const maxRevenue = Math.max(
    ...(data?.revenue_by_period.map((row) => row.revenue) || [1]),
    1
  )

  const totalPeriodRevenue = (data?.revenue_by_period || []).reduce(
    (sum, r) => sum + r.revenue,
    0
  )
  const totalPeriodRides = (data?.revenue_by_period || []).reduce(
    (sum, r) => sum + r.rides,
    0
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue & Driver Settlement Ledger"
        description="Audited ledger derived strictly from completed, verified payments. Unpaid or cancelled trips are explicitly excluded."
        actions={
          <button
            onClick={() => setRefresh((v) => v + 1)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white text-slate-700 border border-slate-200/80 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Recalculate
          </button>
        }
      />

      {/* Interval Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Aggregation Horizon:
          </span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/60">
            {(['day', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  period === p
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p === 'day' ? 'Daily' : p === 'week' ? 'Weekly' : 'Monthly'}
              </button>
            ))}
          </div>
        </div>

        {data && (
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-500">
              Aggregated Gross:{' '}
              <strong className="font-bold text-slate-900">
                {formatMoney(totalPeriodRevenue)}
              </strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">
              Paid Trips:{' '}
              <strong className="font-bold text-slate-900">{totalPeriodRides}</strong>
            </span>
          </div>
        )}
      </div>

      {error && <Notice kind="error">{error}</Notice>}

      {loading && !data ? (
        <LoadingSpinner label="Auditing payment ledger..." />
      ) : (
        data && (
          <div className="space-y-6">
            {/* Chart Panel */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
              <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    Revenue Trajectory by {period}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Completed ride transactions directly compiled from the payments collection.
                  </p>
                </div>
              </div>

              {data.revenue_by_period.length ? (
                <div className="h-64 flex items-end gap-2 sm:gap-3 pt-8 pb-2 overflow-x-auto px-2">
                  {data.revenue_by_period.slice(-31).map((row) => {
                    const heightPercent = Math.max(5, (row.revenue / maxRevenue) * 100)
                    return (
                      <div
                        key={row._id}
                        className="flex-1 min-w-[28px] max-w-[50px] flex flex-col items-center gap-2 h-full justify-end group relative"
                      >
                        {/* Tooltip on hover */}
                        <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-12 z-20 transition-all bg-slate-900 text-white text-[10px] rounded-lg py-1 px-2.5 whitespace-nowrap shadow-xl">
                          <p className="font-bold">{formatMoney(row.revenue)}</p>
                          <p className="text-slate-300">{row.rides} trips</p>
                        </div>

                        {/* Bar */}
                        <div className="w-full bg-slate-100 rounded-t-lg h-full flex items-end overflow-hidden">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg group-hover:from-indigo-500 group-hover:to-indigo-300 transition-all"
                          />
                        </div>

                        {/* Date label */}
                        <span className="text-[10px] font-mono font-medium text-slate-400 truncate w-full text-center">
                          {row._id.slice(-5)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState
                  title="No completed payments in this timeframe"
                  message="Once trips are marked as completed and payments are booked, graphs will render here automatically."
                />
              )}
            </div>

            {/* Split Breakdown Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Driver Earnings Panel */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    Driver Earnings & Payout Ledger
                  </h3>
                  <span className="text-[11px] font-medium text-slate-400">
                    ledger transactions
                  </span>
                </div>
                <EarningsTable rows={data.driver_earnings} />
              </div>

              {/* Cab Revenue Panel */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Car className="w-4 h-4 text-purple-600" />
                    Cab Fleet Revenue Attribution
                  </h3>
                  <span className="text-[11px] font-medium text-slate-400">
                    attributed payments
                  </span>
                </div>
                <EarningsTable rows={data.cab_earnings} isCab />
              </div>
            </div>

            {/* Platform Ledger Disclaimer Notice */}
            <Notice kind="info">
              Platform commission ledger is currently operating in standard pass-through mode.
              No artificial deductions or simulated commissions have been added to this display.
            </Notice>
          </div>
        )
      )}
    </div>
  )
}

function EarningsTable({
  rows,
  isCab = false,
}: {
  rows: RevenueData['driver_earnings']
  isCab?: boolean
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50/60 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <th className="py-3 px-5">{isCab ? 'Vehicle Fleet' : 'Driver Partner'}</th>
            <th className="py-3 px-5">Registered Name</th>
            <th className="py-3 px-5">Completed Trips</th>
            <th className="py-3 px-5 text-right">Recorded Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row._id} className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3 px-5 font-semibold text-slate-900">
                {isCab
                  ? `${row.driver?.vehicle_type || 'Cab'} ${row.driver?.vehicle_number || ''}`
                  : row.driver?.name || row._id}
              </td>
              <td className="py-3 px-5 text-slate-600">{row.driver?.name || row._id}</td>
              <td className="py-3 px-5 font-bold text-slate-700">{row.rides}</td>
              <td className="py-3 px-5 text-right font-extrabold text-slate-900">
                {formatMoney(row.earnings)}
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={4} className="py-6 text-center text-slate-400">
                No recorded earnings transactions.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
