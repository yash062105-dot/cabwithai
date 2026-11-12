import { useState, useEffect, useCallback } from 'react'
import { adminService } from '../../services/adminService'
import type { AccountStatus, Driver, Page, User } from '../../types'
import { PageHeader } from '../../components/common/PageHeader'
import { Notice } from '../../components/ui/Notice'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { Pagination } from '../../components/tables/Pagination'
import { AccountDetailModal } from './AccountDetailModal'
import { formatDate } from '../../utils/formatters'
import {
  Search,
  Eye,
  RotateCcw,
  Calendar,
} from 'lucide-react'

interface AccountsPageProps {
  kind: 'users' | 'drivers'
}

export function AccountsPage({ kind }: AccountsPageProps) {
  const isDriver = kind === 'drivers'
  const title = isDriver ? 'Driver Registrations & Approvals' : 'Rider Accounts'
  const description = isDriver
    ? 'Verify driver profiles, vehicle documents, and manage approval status.'
    : 'Search customer accounts, review trip histories, and manage system access.'

  const [result, setResult] = useState<Page<User | Driver> | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [refresh, setRefresh] = useState(0)
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null)
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const values = {
      page,
      page_size: pageSize,
      status: status || undefined,
      search: search || undefined,
      created_from: from ? `${from}T00:00:00Z` : undefined,
      created_to: to ? `${to}T00:00:00Z` : undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
    }
    try {
      const data = await adminService.getAccounts(kind, values)
      setResult(data)
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Records could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [kind, page, pageSize, status, search, from, to, sortBy, sortOrder])

  useEffect(() => {
    const timer = window.setTimeout(load, 0)
    return () => window.clearTimeout(timer)
  }, [load, refresh])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  async function showDetails(account: User | Driver) {
    const identifier = isDriver ? (account as Driver).driver_id : account._id
    try {
      const data = await adminService.getAccountDetails(kind, identifier)
      setDetail(data)
    } catch (reason) {
      setToast(reason instanceof Error ? reason.message : 'Could not load account details.')
    }
  }

  async function updateStatus(account: User | Driver, nextStatus: AccountStatus) {
    const current = account.status || 'active'
    if (current === nextStatus) return

    const name = account.name || (account as Driver).driver_id
    const confirmMessage =
      isDriver && nextStatus === 'active'
        ? `Approve and activate driver account for ${name}?`
        : `Change status to "${nextStatus}" for ${name}?`

    if (!window.confirm(confirmMessage)) return

    const identifier = isDriver ? (account as Driver).driver_id : account._id
    try {
      await adminService.updateAccountStatus(kind, identifier, nextStatus)
      setToast(`${name} status updated to ${nextStatus}.`)
      setRefresh((val) => val + 1)
    } catch (reason) {
      setToast(reason instanceof Error ? reason.message : 'Status could not be updated.')
    }
  }

  function clearFilters() {
    setSearch('')
    setStatus('')
    setFrom('')
    setTo('')
    setSortBy('created_at')
    setSortOrder('desc')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <button
            onClick={() => setRefresh((val) => val + 1)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white text-slate-700 border border-slate-200/80 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Refresh
          </button>
        }
      />

      {toast && <Notice kind="success">{toast}</Notice>}
      {error && <Notice kind="error">{error}</Notice>}

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/40">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                aria-label="Search accounts"
                placeholder={
                  isDriver
                    ? 'Search by driver name, phone, driver ID, or vehicle number...'
                    : 'Search by user name, phone, or email...'
                }
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Controls Row */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Select */}
              <select
                aria-label="Filter by status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value)
                  setPage(1)
                }}
                className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">{isDriver ? 'Pending / Inactive' : 'Inactive'}</option>
                <option value="blocked">Blocked</option>
              </select>

              {/* Date Filters */}
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

              {/* Sort Select */}
              <select
                aria-label="Sort accounts"
                value={`${sortBy}:${sortOrder}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split(':')
                  setSortBy(field)
                  setSortOrder(direction)
                }}
                className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
              >
                <option value="created_at:desc">Newest First</option>
                <option value="created_at:asc">Oldest First</option>
                <option value="name:asc">Name (A–Z)</option>
                <option value="name:desc">Name (Z–A)</option>
                <option value="status:asc">Status</option>
              </select>

              <button
                onClick={clearFilters}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading && !result ? (
          <LoadingSpinner label="Fetching registered accounts..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Account Details</th>
                  <th className="py-3.5 px-6">Contact Info</th>
                  {isDriver && <th className="py-3.5 px-6">Vehicle & Documents</th>}
                  <th className="py-3.5 px-6">Status</th>
                  {isDriver && <th className="py-3.5 px-6">Availability</th>}
                  <th className="py-3.5 px-6">Registered</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {result?.items.map((account) => {
                  const driver = account as Driver
                  const statusVal = account.status || 'active'
                  return (
                    <tr
                      key={isDriver ? driver.driver_id : account._id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <button
                          onClick={() => showDetails(account)}
                          className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-left cursor-pointer flex items-center gap-1.5"
                        >
                          {account.name || 'Unnamed account'}
                        </button>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {isDriver ? driver.driver_id : account._id}
                        </p>
                      </td>

                      <td className="py-4 px-6 text-slate-700">
                        <p className="font-medium">{account.phone || account.email || '—'}</p>
                        {account.email && account.phone && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{account.email}</p>
                        )}
                      </td>

                      {isDriver && (
                        <td className="py-4 px-6 text-slate-700">
                          <p className="font-semibold text-slate-900">
                            {driver.vehicle_type || '—'}{' '}
                            <span className="font-normal text-slate-500">
                              · {driver.vehicle_model || 'Model pending'}
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                            {driver.vehicle_number || 'No plate'}{' '}
                            <span className="font-sans">
                              · Lic: {driver.license_number || 'none'}
                            </span>
                          </p>
                        </td>
                      )}

                      <td className="py-4 px-6">
                        <StatusBadge status={statusVal} />
                      </td>

                      {isDriver && (
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
                            {driver.online ? 'Online' : 'Offline'}
                          </span>
                        </td>
                      )}

                      <td className="py-4 px-6 text-slate-500 text-[11px]">
                        {formatDate(account.created_at)}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => showDetails(account)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-2xs cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Details
                          </button>

                          <select
                            aria-label={`Set status for ${account.name}`}
                            value={statusVal}
                            onChange={(e) =>
                              updateStatus(account, e.target.value as AccountStatus)
                            }
                            className="px-2 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 shadow-2xs cursor-pointer"
                          >
                            <option value="active">
                              {isDriver && statusVal === 'inactive'
                                ? '✓ Approve & Activate'
                                : 'Active'}
                            </option>
                            <option value="inactive">Deactivate</option>
                            <option value="blocked">Block Account</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {!loading && !result?.items.length && (
                  <tr>
                    <td colSpan={isDriver ? 7 : 5}>
                      <EmptyState
                        title="No matching accounts found"
                        message="Try clearing your filters, refining your search query, or checking date ranges."
                        action={
                          <button
                            onClick={clearFilters}
                            className="px-3.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
                          >
                            Reset Search Filters
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

        {/* Pagination */}
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

      {/* Account Details Modal */}
      {detail && (
        <AccountDetailModal
          detail={detail}
          driver={isDriver}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  )
}
