import { formatMoney, formatDate } from '../../utils/formatters'
import { StatusBadge } from '../../components/ui/StatusBadge'
import type { Ride } from '../../types'
import { X, User, Car, Route, AlertCircle } from 'lucide-react'

interface AccountDetailModalProps {
  detail: Record<string, unknown>
  driver: boolean
  onClose: () => void
}

export function AccountDetailModal({ detail, driver, onClose }: AccountDetailModalProps) {
  const profile = (driver ? detail.driver : detail.user) as Record<string, unknown> | undefined
  const bookings = (detail.bookings || []) as Ride[]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              {driver ? <Car className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                {driver ? 'DRIVER PROFILE' : 'RIDER PROFILE'}
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                {String(profile?.name || 'Account Details')}
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
          {/* Key Metrics / Financial Summary */}
          {driver ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100/80">
                <p className="text-xs font-semibold text-indigo-900">Recorded Earnings</p>
                <p className="text-xl font-extrabold text-indigo-700 mt-1">
                  {formatMoney(Number(detail.earnings))}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100/80">
                <p className="text-xs font-semibold text-purple-900">Completed Rides</p>
                <p className="text-xl font-extrabold text-purple-700 mt-1">
                  {String(detail.completed_rides ?? 0)}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100/80">
                <p className="text-xs font-semibold text-emerald-900">Documentation</p>
                <p className="text-sm font-bold text-emerald-800 mt-1.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {profile?.license_number ? 'License on file' : 'No docs submitted'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100/80">
                <p className="text-xs font-semibold text-indigo-900">Total Expenditure</p>
                <p className="text-xl font-extrabold text-indigo-700 mt-1">
                  {formatMoney(Number(detail.spending))}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100/80">
                <p className="text-xs font-semibold text-purple-900">Paid Trips</p>
                <p className="text-xl font-extrabold text-purple-700 mt-1">
                  {String(detail.paid_rides ?? 0)}
                </p>
              </div>
            </div>
          )}

          {/* Account Attributes Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Registration Attributes
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60">
              {Object.entries(profile || {})
                .filter(
                  ([key, value]) =>
                    !key.startsWith('_') &&
                    typeof value !== 'object' &&
                    key !== 'password_hash' &&
                    key !== 'hashed_password'
                )
                .map(([key, value]) => (
                  <div key={key} className="space-y-0.5">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase">
                      {key.replaceAll('_', ' ')}
                    </p>
                    <p className="text-xs font-bold text-slate-800 break-words">
                      {String(value ?? '—')}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          {/* Recent Rides Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Route className="w-4 h-4 text-indigo-500" />
              Recent Ride Activity
            </h3>
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Ride ID</th>
                    <th className="py-2.5 px-4">Route</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Fare</th>
                    <th className="py-2.5 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {bookings.map((ride) => (
                    <tr key={ride._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {ride._id.slice(-8)}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div className="max-w-xs truncate">
                          <span className="font-medium">{ride.pickup_address || '—'}</span>
                          <span className="mx-1 text-slate-400">→</span>
                          <span>{ride.destination_address || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={ride.status} />
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {formatMoney(ride.fare_amount ?? ride.estimated_fare)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {formatDate(ride.created_at)}
                      </td>
                    </tr>
                  ))}
                  {!bookings.length && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                        <AlertCircle className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                        No past trip activity recorded for this account.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  )
}
