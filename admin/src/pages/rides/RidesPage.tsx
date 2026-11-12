import { useState, useEffect, useCallback } from 'react'
import { adminService } from '../../services/adminService'
import type { Page, Ride } from '../../types'
import { PageHeader } from '../../components/common/PageHeader'
import { Notice } from '../../components/ui/Notice'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { Pagination } from '../../components/tables/Pagination'
import { RideDetailModal } from './RideDetailModal'
import { formatMoney, formatDate } from '../../utils/formatters'
import {
  Search,
  RotateCcw,
  Eye,
  Calendar,
} from 'lucide-react'

export function RidesPage() {
  const [result, setResult] = useState<Page<Ride> | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [userId, setUserId] = useState('')
  const [driverId, setDriverId] = useState('')
  const [sortOrder, setSortOrder] = useState('desc')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)
  const [selectedRide, setSelectedRide] = useState<Record<string, unknown> | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await adminService.getRides({
        page,
        page_size: pageSize,
        status: status || undefined,
        search: search || undefined,
        user_id: userId || undefined,
        driver_id: driverId || undefined,
        created_from: from ? `${from}T00:00:00Z` : undefined,
        created_to: to ? `${to}T00:00:00Z` : undefined,
        sort_order: sortOrder,
      })
      setResult(data)
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Ride records could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, status, search, userId, driverId, from, to, sortOrder])

  useEffect(() => {
    const timer = window.setTimeout(load, 0)
    return () => window.clearTimeout(timer)
  }, [load, refresh])

  async function showRideDetails(bookingId: string) {
    try {
      const details = await adminService.getRideDetails(bookingId)
      setSelectedRide(details)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Ride details could not be loaded.')
    }
  }

  function clearFilters() {
    setStatus('')
    setSearch('')
    setUserId('')
    setDriverId('')
    setFrom('')
    setTo('')
    setSortOrder('desc')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ride Operations & Bookings"
        description="Comprehensive dispatch ledger, route logs, passenger-driver pairs, and real-time payment audit."
        actions={
          <button
            onClick={() => setRefresh((v) => v + 1)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white text-slate-700 border border-slate-200/80 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Refresh Records
          </button>
        }
      />

      {error && <Notice kind="error">{error}</Notice>}

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Advanced Filters */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/40 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                placeholder="Search Ride ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-10 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <input
              placeholder="Filter by Rider ID..."
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              placeholder="Filter by Driver ID..."
              value={driverId}
              onChange={(e) => {
                setDriverId(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 capitalize"
            >
              <option value="">All Ride Statuses</option>
              {['requested', 'accepted', 'in_progress', 'completed', 'cancelled'].map((val) => (
                <option key={val} value={val}>
                  {val.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>From</span>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value)
                    setPage(1)
                  }}
                  className="bg-transparent text-xs text-slate-700 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>To</span>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value)
                    setPage(1)
                  }}
                  className="bg-transparent text-xs text-slate-700 focus:outline-none"
                />
              </div>

              <select
                aria-label="Sort rides by date"
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value)
                  setPage(1)
                }}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>

            <button
              onClick={clearFilters}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Records Table */}
        {loading && !result ? (
          <LoadingSpinner label="Fetching dispatch ledger..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Ride Identification</th>
                  <th className="py-3.5 px-6">Passenger / Rider</th>
                  <th className="py-3.5 px-6">Assigned Driver & Cab</th>
                  <th className="py-3.5 px-6">Routing Waypoints</th>
                  <th className="py-3.5 px-6">Trip Status</th>
                  <th className="py-3.5 px-6">Fare & Payment</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {result?.items.map((ride) => (
                  <tr key={ride._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <button
                        onClick={() => showRideDetails(ride._id)}
                        className="font-mono font-bold text-slate-900 hover:text-indigo-600 transition-colors text-left cursor-pointer"
                      >
                        {ride._id}
                      </button>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatDate(ride.created_at)}
                      </p>
                    </td>

                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-900">
                        {ride.rider_name || 'Passenger'}
                      </p>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5 truncate max-w-[120px]">
                        {ride.user_id}
                      </p>
                    </td>

                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-900">
                        {ride.driver_name || 'Driver Assigned'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        <span className="font-bold">{ride.cab_type || 'Cab'}</span> ·{' '}
                        <span className="font-mono">{ride.vehicle_number || 'No plate'}</span>
                      </p>
                    </td>

                    <td className="py-4 px-6 max-w-xs">
                      <div className="space-y-0.5 text-slate-700">
                        <p className="truncate font-medium flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          {ride.pickup_address || '—'}
                        </p>
                        <p className="truncate text-slate-500 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                          {ride.destination_address || '—'}
                        </p>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <StatusBadge status={ride.status} />
                    </td>

                    <td className="py-4 px-6">
                      <p className="font-extrabold text-slate-900 text-sm">
                        {formatMoney(ride.fare_amount ?? ride.estimated_fare)}
                      </p>
                      <p className="text-[11px] text-slate-400 capitalize mt-0.5">
                        {ride.payment_method || 'Cash'} ·{' '}
                        <span className="font-medium text-slate-600">
                          {ride.payment_status || (ride.status === 'completed' ? 'paid' : 'unpaid')}
                        </span>
                      </p>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => showRideDetails(ride._id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Audit
                      </button>
                    </td>
                  </tr>
                ))}

                {!loading && !result?.items.length && (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        title="No ride records matching query"
                        message="Try clearing your search query or adjusting your date range."
                        action={
                          <button
                            onClick={clearFilters}
                            className="px-3.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
                          >
                            Reset Filters
                          </button>
                        }
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {result && (
          <Pagination
            result={result}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={(size) => {
              setPageSize(size)
              setPage(1)
            }}
          />
        )}
      </div>

      {selectedRide && (
        <RideDetailModal detail={selectedRide} onClose={() => setSelectedRide(null)} />
      )}
    </div>
  )
}
