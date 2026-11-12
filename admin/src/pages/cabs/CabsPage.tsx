import { useState, useEffect, useCallback } from 'react'
import { adminService } from '../../services/adminService'
import type { Driver, Page } from '../../types'
import { PageHeader } from '../../components/common/PageHeader'
import { Notice } from '../../components/ui/Notice'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { Pagination } from '../../components/tables/Pagination'
import { Search, RotateCcw, Car, MapPin } from 'lucide-react'

export function CabsPage() {
  const [pageData, setPageData] = useState<Page<Driver> | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const [liveOnly, setLiveOnly] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)

  const load = useCallback(async () => {
    try {
      const res = await adminService.getCabs({
        page,
        page_size: pageSize,
        search: search || undefined,
        online: liveOnly ? 'true' : undefined,
      })
      setPageData(res)
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Fleet vehicles could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, liveOnly])

  useEffect(() => {
    const timer = window.setTimeout(load, 0)
    return () => window.clearTimeout(timer)
  }, [load, refresh])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cab Fleet Registry"
        description="Catalog of all vehicles registered in the platform, along with real-time driver availability and verified plates."
        actions={
          <button
            onClick={() => setRefresh((v) => v + 1)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white text-slate-700 border border-slate-200/80 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Refresh Fleet
          </button>
        }
      />

      {error && <Notice kind="error">{error}</Notice>}

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              placeholder="Search by vehicle model, number, driver name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none bg-white px-3.5 py-2 border border-slate-200 rounded-xl shadow-2xs">
            <input
              type="checkbox"
              checked={liveOnly}
              onChange={(e) => {
                setLiveOnly(e.target.checked)
                setPage(1)
              }}
              className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
            />
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Live Active Cabs Only
            </span>
          </label>
        </div>

        {/* Fleet Table */}
        {loading && !pageData ? (
          <LoadingSpinner label="Fetching vehicle registry..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Vehicle Specification</th>
                  <th className="py-3.5 px-6">Assigned Driver</th>
                  <th className="py-3.5 px-6">Registration Plate</th>
                  <th className="py-3.5 px-6">Live Coordinates</th>
                  <th className="py-3.5 px-6">Availability</th>
                  <th className="py-3.5 px-6">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {pageData?.items.map((driver) => (
                  <tr key={driver.driver_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100/80 text-indigo-600 flex items-center justify-center shrink-0">
                          <Car className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{driver.vehicle_type || '—'}</p>
                          <p className="text-[11px] text-slate-500">
                            {driver.vehicle_model || 'Model unassigned'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-900">{driver.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{driver.phone || '—'}</p>
                    </td>

                    <td className="py-4 px-6">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 font-mono font-bold text-slate-800 text-[11px] border border-slate-200">
                        {driver.vehicle_number || 'PENDING'}
                      </span>
                    </td>

                    <td className="py-4 px-6 font-mono text-[11px] text-slate-600">
                      {driver.latitude != null && driver.longitude != null ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>
                            {driver.latitude.toFixed(4)}, {driver.longitude.toFixed(4)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Unavailable</span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 font-semibold ${
                          driver.online ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            driver.online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                          }`}
                        />
                        {driver.online ? 'Live / Active' : 'Offline'}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <StatusBadge status={driver.status || 'active'} />
                    </td>
                  </tr>
                ))}

                {!loading && !pageData?.items.length && (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        title="No registered cabs found"
                        message="Driver vehicle profiles will be automatically listed once approved."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {pageData && (
          <Pagination
            result={pageData}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={(size) => {
              setPageSize(size)
              setPage(1)
            }}
          />
        )}
      </div>
    </div>
  )
}
