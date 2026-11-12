import { useState, useEffect, useCallback, useMemo } from 'react'
import { adminService } from '../../services/adminService'
import type { DashboardData } from '../../types'
import { PageHeader } from '../../components/common/PageHeader'
import { MetricCard } from '../../components/ui/MetricCard'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Notice } from '../../components/ui/Notice'
import { formatMoney, formatDate } from '../../utils/formatters'
import {
  Users,
  ShieldCheck,
  Car,
  ArrowLeftRight,
  IndianRupee,
  Calendar,
  Clock,
  Percent,
  RefreshCw,
  Activity,
} from 'lucide-react'

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await adminService.getDashboard()
      setData(res)
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Dashboard data could not be loaded.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    const initialTimer = window.setTimeout(load, 0)
    const timer = window.setInterval(load, 20_000)
    return () => {
      window.clearTimeout(initialTimer)
      window.clearInterval(timer)
    }
  }, [load])

  const handleManualRefresh = () => {
    setRefreshing(true)
    load()
  }

  const cards = useMemo(
    () =>
      data
        ? [
            {
              label: 'Registered Users',
              value: data.users.total,
              note: `${data.users.active} active accounts`,
              icon: <Users className="w-5 h-5" />,
              color: 'blue' as const,
            },
            {
              label: 'Registered Drivers',
              value: data.drivers.total,
              note: `${data.drivers.inactive} pending approval`,
              icon: <ShieldCheck className="w-5 h-5" />,
              color: 'violet' as const,
            },
            {
              label: 'Live Active Cabs',
              value: data.cabs.live,
              note: `${data.cabs.total} total fleet registered`,
              icon: <Car className="w-5 h-5" />,
              color: 'emerald' as const,
            },
            {
              label: 'Ongoing Rides',
              value: data.rides.ongoing,
              note: `${data.rides.completed} completed trips`,
              icon: <ArrowLeftRight className="w-5 h-5" />,
              color: 'amber' as const,
            },
            {
              label: 'Total Platform Revenue',
              value: formatMoney(data.revenue.total),
              note: 'Recorded ride payments',
              icon: <IndianRupee className="w-5 h-5" />,
              color: 'emerald' as const,
            },
            {
              label: "Today's Revenue",
              value: formatMoney(data.revenue.today),
              note: 'Current UTC Day',
              icon: <Clock className="w-5 h-5" />,
              color: 'blue' as const,
            },
            {
              label: 'Monthly Revenue',
              value: formatMoney(data.revenue.month),
              note: 'Current Month · UTC',
              icon: <Calendar className="w-5 h-5" />,
              color: 'violet' as const,
            },
            {
              label: 'Platform Earnings',
              value: data.revenue.commission_records
                ? formatMoney(data.revenue.platform_earnings)
                : 'Not configured',
              note: data.revenue.commission_records
                ? 'Recorded commission ledger'
                : 'No commission records exist',
              icon: <Percent className="w-5 h-5" />,
              color: 'amber' as const,
            },
          ]
        : [],
    [data]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations Overview"
        description="Real-time cab platform metrics, fleet status, and database-backed financial performance."
        actions={
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white text-slate-700 border border-slate-200/80 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Metrics
          </button>
        }
      />

      {error && <Notice kind="error">{error}</Notice>}

      {loading && !data ? (
        <LoadingSpinner label="Loading real-time operational metrics..." />
      ) : (
        data && (
          <div className="space-y-6">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {cards.map((card) => (
                <MetricCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  note={card.note}
                  icon={card.icon}
                  color={card.color}
                />
              ))}
            </div>

            {/* Health Overview Panels */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-100 gap-2 mb-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    Account & Fleet Health
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live account status distribution and trip state breakdown
                  </p>
                </div>
                <div className="text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60 font-medium">
                  Updated: {formatDate(data.generated_at)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <HealthColumn
                  title="Rider Accounts"
                  values={data.users}
                  total={data.users.total}
                  colorClass="bg-blue-500"
                />
                <HealthColumn
                  title="Driver Registrations"
                  values={data.drivers}
                  total={data.drivers.total}
                  colorClass="bg-purple-500"
                />
                <HealthColumn
                  title="Trip Statuses"
                  values={data.rides.by_status}
                  total={data.rides.total}
                  colorClass="bg-amber-500"
                />
              </div>
            </div>
          </div>
        )
      )}
    </div>
  )
}

function HealthColumn({
  title,
  values,
  total,
  colorClass,
}: {
  title: string
  values: Record<string, number>
  total: number
  colorClass: string
}) {
  return (
    <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">{title}</h3>
        <span className="text-xs font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
          {total} Total
        </span>
      </div>

      <div className="space-y-2 pt-1">
        {Object.entries(values)
          .filter(([key]) => key !== 'total')
          .map(([label, count]) => {
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div key={label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="capitalize text-slate-600 font-medium">
                    {label.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <span>{count}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${colorClass}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
