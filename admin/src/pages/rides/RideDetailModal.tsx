import { formatMoney, formatDate } from '../../utils/formatters'
import { StatusBadge } from '../../components/ui/StatusBadge'
import type { Ride, User, Driver } from '../../types'
import { X, Route, Shield, User as UserIcon } from 'lucide-react'

interface RideDetailModalProps {
  detail: Record<string, unknown>
  onClose: () => void
}

export function RideDetailModal({ detail, onClose }: RideDetailModalProps) {
  const ride = detail.ride as Ride | undefined
  const user = detail.user as User | null
  const driver = detail.driver as Driver | null
  const payment = detail.payment as Record<string, unknown> | null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                TRIP AUDIT DOSSIER
              </span>
              <h2 className="text-lg font-bold text-slate-900 font-mono">
                {ride?._id || 'Ride Overview'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {ride && (
            <>
              {/* Financial Snapshot */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100/80">
                  <p className="text-xs font-semibold text-indigo-900">Fare Amount</p>
                  <p className="text-2xl font-black text-indigo-700 mt-1">
                    {formatMoney(ride.fare_amount ?? ride.estimated_fare)}
                  </p>
                  <p className="text-[11px] text-indigo-500 capitalize mt-0.5">
                    Tier: {ride.cab_type || 'Standard'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Trip Status</p>
                    <div className="mt-1.5">
                      <StatusBadge status={ride.status} />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Payment: {ride.payment_method || 'Cash'} ·{' '}
                    <span className="capitalize">
                      {payment ? 'paid' : ride.status === 'cancelled' ? 'not charged' : 'unpaid'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Waypoints */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Pickup Location
                    </p>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">
                      {ride.pickup_address || 'Address unrecorded'}
                    </p>
                    {ride.pickup_lat && ride.pickup_lon && (
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Coordinates: {ride.pickup_lat}, {ride.pickup_lon}
                      </p>
                    )}
                  </div>
                </div>

                <div className="w-0.5 h-4 bg-slate-200 ml-1" />

                <div className="flex items-start gap-3">
                  <div className="mt-1 w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Dropoff Destination
                    </p>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">
                      {ride.destination_address || 'Address unrecorded'}
                    </p>
                    {ride.destination_lat && ride.destination_lon && (
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Coordinates: {ride.destination_lat}, {ride.destination_lon}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Rider & Driver Parties */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px]">
                    <UserIcon className="w-3.5 h-3.5 text-indigo-500" />
                    Rider Party
                  </div>
                  <p className="font-bold text-slate-900">
                    {user?.name || ride.rider_name || ride.user_id}
                  </p>
                  <p className="text-slate-500">{user?.phone || 'No phone'}</p>
                  <p className="font-mono text-[10px] text-slate-400">UID: {ride.user_id}</p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px]">
                    <Shield className="w-3.5 h-3.5 text-purple-500" />
                    Assigned Driver
                  </div>
                  <p className="font-bold text-slate-900">
                    {driver?.name || ride.driver_name || ride.driver_id}
                  </p>
                  <p className="text-slate-500">
                    Plate: {driver?.vehicle_number || ride.vehicle_number || '—'}
                  </p>
                  <p className="font-mono text-[10px] text-slate-400">DID: {ride.driver_id}</p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/60 text-xs">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Requested At</p>
                  <p className="font-medium text-slate-700 mt-0.5 text-[11px]">
                    {formatDate(ride.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Trip Started At</p>
                  <p className="font-medium text-slate-700 mt-0.5 text-[11px]">
                    {formatDate(ride.started_at)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
