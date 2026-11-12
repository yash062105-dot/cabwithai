import { useState, useEffect, useCallback } from 'react'
import { adminService } from '../../services/adminService'
import type { MonitoringDriver, MonitoringPageData, Ride } from '../../types'
import { PageHeader } from '../../components/common/PageHeader'
import { Notice } from '../../components/ui/Notice'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/formatters'
import {
  Radio,
  Navigation,
} from 'lucide-react'

export function MonitoringPage() {
  const [data, setData] = useState<MonitoringPageData | null>(null)
  const [selected, setSelected] = useState<MonitoringDriver | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const result = await adminService.getMonitoringFleet(200)
      setData(result)
      setSelected(
        (previous) =>
          result.items.find((driver) => driver.driver_id === previous?.driver_id) ||
          result.items[0] ||
          null
      )
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Live fleet could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const initialTimer = window.setTimeout(load, 0)
    const timer = window.setInterval(load, 10_000)
    return () => {
      window.clearTimeout(initialTimer)
      window.clearInterval(timer)
    }
  }, [load])

  const ride = selected?.current_ride as Ride | null | undefined
  const mapUrl =
    selected?.latitude != null && selected.longitude != null
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${selected.longitude - 0.02}%2C${
          selected.latitude - 0.02
        }%2C${selected.longitude + 0.02}%2C${selected.latitude + 0.02}&layer=mapnik&marker=${
          selected.latitude
        }%2C${selected.longitude}`
      : ''

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Fleet Radar & Telemetry"
        description="Real-time geographic tracking of online drivers, active trips, and telemetry updates (auto-refreshes every 10s)."
        actions={
          <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Polling Live (10s interval)
          </div>
        }
      />

      {error && <Notice kind="error">{error}</Notice>}

      {loading && !data ? (
        <LoadingSpinner label="Connecting to telemetry stream..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Map Viewer Panel (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-[580px]">
            <div className="p-4 border-b border-slate-200/80 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {selected ? `Map Tracking · ${selected.name}` : 'Live Telemetry Map'}
                </h2>
              </div>
              {selected?.latitude != null && selected.longitude != null && (
                <span className="font-mono text-xs text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}
                </span>
              )}
            </div>

            <div className="flex-1 bg-slate-100 relative">
              {selected && mapUrl ? (
                <iframe
                  title={`Live location of ${selected.name}`}
                  src={mapUrl}
                  loading="lazy"
                  className="w-full h-full border-none"
                />
              ) : (
                <div className="h-full flex items-center justify-center p-6">
                  <EmptyState
                    title="No Live GPS Coordinates"
                    message="Driver is either offline or hasn't transmitted location coordinates yet."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Online Drivers & Selected Trip (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Drivers list */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                  Online Fleet ({data?.total ?? 0})
                </h2>
                <span className="text-[11px] text-slate-400 font-medium">Click to focus</span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {data?.items.map((driver) => {
                  const isSelected = selected?.driver_id === driver.driver_id
                  return (
                    <button
                      key={driver.driver_id}
                      onClick={() => setSelected(driver)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/80 border-indigo-200 ring-2 ring-indigo-500/10'
                          : 'bg-white border-slate-200/70 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900">{driver.name}</span>
                        <StatusBadge
                          status={
                            driver.current_ride
                              ? (driver.current_ride as Ride).status
                              : 'online'
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          {driver.vehicle_type} · {driver.vehicle_number || 'No plate'}
                        </span>
                        <span className="font-mono text-slate-400">
                          {driver.latitude != null
                            ? `${driver.latitude.toFixed(3)}, ${driver.longitude?.toFixed(3)}`
                            : 'No GPS'}
                        </span>
                      </div>
                    </button>
                  )
                })}

                {!data?.items.length && (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No approved drivers are currently online.
                  </div>
                )}
              </div>
            </div>

            {/* Selected Driver / Ride Info */}
            {selected && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{selected.name}</h3>
                    <p className="text-xs text-slate-500">
                      {selected.vehicle_model} · {selected.vehicle_number}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                    ACTIVE TELEMETRY
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Driver ID</p>
                      <p className="font-mono font-medium text-slate-800 mt-0.5 truncate">
                        {selected.driver_id}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Last Location
                      </p>
                      <p className="font-medium text-slate-800 mt-0.5 text-[11px] truncate">
                        {formatDate(selected.last_location_at)}
                      </p>
                    </div>
                  </div>

                  {ride ? (
                    <div className="border border-indigo-100 bg-indigo-50/40 rounded-xl p-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                        <span className="font-bold text-indigo-900">Current Trip Assignment</span>
                        <StatusBadge status={ride.status} />
                      </div>
                      <div className="space-y-1.5 text-slate-700">
                        <p>
                          <strong className="text-slate-900">Passenger:</strong>{' '}
                          {String(ride.rider?.name || ride.rider_name || 'Passenger')}
                        </p>
                        <p className="truncate">
                          <strong className="text-slate-900">Pickup:</strong>{' '}
                          {ride.pickup_address || '—'}
                        </p>
                        <p className="truncate">
                          <strong className="text-slate-900">Dropoff:</strong>{' '}
                          {ride.destination_address || '—'}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Ride ID: {ride._id}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500 border border-slate-100">
                      Driver is currently idle with no active ride assigned.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
