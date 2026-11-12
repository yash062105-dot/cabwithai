import {type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useState} from 'react'
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom'
import {ApiError, api, queryString} from './api'
import type {AccountStatus, DashboardData, Driver, Page, Ride, User} from './types'
import './App.css'

const money = (amount: number | undefined) =>
  new Intl.NumberFormat('en-IN', {style: 'currency', currency: 'INR', maximumFractionDigits: 0}).format(amount || 0)
const dateText = (value?: string) => value ? new Date(value).toLocaleString() : '—'
const accountStatus = (account: User) => account.status || 'active'

function LoginPage({onLogin}: {onLogin: (token: string) => void}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await api<{access_token: string; user: User}>('/auth/admin-login', {
        method: 'POST',
        body: JSON.stringify({email, password}),
      })
      if (result.user.role !== 'admin') throw new Error('Administrator access is required.')
      localStorage.setItem('adminToken', result.access_token)
      onLogin(result.access_token)
      navigate('/', {replace: true})
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Sign in failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-shell">
      <form className="login-card" onSubmit={submit}>
        <div className="brand-mark">C</div>
        <p className="eyebrow">CAB OPERATIONS</p>
        <h1>Administrator sign in</h1>
        <p className="muted">Use your provisioned administrator credentials.</p>
        <label>Email<input type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} /></label>
        <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /></label>
        {error && <Notice kind="error">{error}</Notice>}
        <button className="button primary wide" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </main>
  )
}

function Notice({kind, children}: {kind: 'error' | 'success' | 'info'; children: ReactNode}) {
  return <div className={`notice ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</div>
}

function ProtectedLayout({onLogout}: {onLogout: () => void}) {
  const [checking, setChecking] = useState(true)
  const [valid, setValid] = useState(false)
  const [name, setName] = useState('Admin')

  useEffect(() => {
    api<User>('/auth/me')
      .then(profile => {
        if (profile.role !== 'admin' || (profile.status && profile.status !== 'active')) {
          throw new ApiError('Administrator access is required.', 403)
        }
        setName(profile.name || 'Admin')
        setValid(true)
      })
      .catch(() => {
        localStorage.removeItem('adminToken')
        onLogout()
      })
      .finally(() => setChecking(false))
  }, [onLogout])

  if (checking) return <div className="full-loading">Checking administrator access…</div>
  if (!valid) return <Navigate to="/login" replace />

  const navigation = [
    {to: '/', label: 'Overview', icon: '▦', end: true},
    {to: '/users', label: 'Users', icon: '♙'},
    {to: '/drivers', label: 'Drivers & approvals', icon: '⌁'},
    {to: '/cabs', label: 'Cabs', icon: '▰'},
    {to: '/monitoring', label: 'Live monitoring', icon: '◎'},
    {to: '/rides', label: 'Rides', icon: '⇄'},
    {to: '/revenue', label: 'Revenue & earnings', icon: '₹'},
  ]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><div className="brand-mark">C</div><div><strong>CAB</strong><small>CONTROL CENTER</small></div></div>
        <p className="nav-caption">WORKSPACE</p>
        <nav>{navigation.map(item => <NavLink key={item.to} to={item.to} end={item.end} className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}><span>{item.icon}</span>{item.label}</NavLink>)}</nav>
        <div className="sidebar-bottom"><span className="online-dot" /> API-connected workspace</div>
      </aside>
      <div className="main-column">
        <header className="topbar"><div><span className="breadcrumb">Administration</span><strong> / Operations</strong></div><div className="admin-identity"><span className="avatar">{name.slice(0, 1).toUpperCase()}</span><span>{name}</span><button className="button ghost small" onClick={onLogout}>Sign out</button></div></header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  )
}

function PageHeading({title, description, action}: {title: string; description: string; action?: ReactNode}) {
  return <div className="page-heading"><div><p className="eyebrow">OPERATIONS</p><h1>{title}</h1><p className="muted">{description}</p></div>{action}</div>
}

function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)
  const load = useCallback(async () => {
    try {
      setData(await api<DashboardData>('/admin/dashboard'))
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Dashboard data could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    const initialTimer = window.setTimeout(load, 0)
    const timer = window.setInterval(load, 20_000)
    return () => {
      window.clearTimeout(initialTimer)
      window.clearInterval(timer)
    }
  }, [load, refresh])

  const cards = useMemo(() => data ? [
    {label: 'Registered users', value: data.users.total, note: `${data.users.active} active`, icon: '♙', color: 'blue'},
    {label: 'Registered drivers', value: data.drivers.total, note: `${data.drivers.inactive} pending approval`, icon: '⌁', color: 'violet'},
    {label: 'Live cabs', value: data.cabs.live, note: `${data.cabs.total} registered vehicles`, icon: '▰', color: 'green'},
    {label: 'Ongoing rides', value: data.rides.ongoing, note: `${data.rides.completed} completed`, icon: '⇄', color: 'amber'},
    {label: 'Total ride revenue', value: money(data.revenue.total), note: 'Completed recorded payments', icon: '₹', color: 'green'},
    {label: "Today's revenue", value: money(data.revenue.today), note: 'UTC day', icon: '◷', color: 'blue'},
    {label: 'Monthly revenue', value: money(data.revenue.month), note: 'Current month · UTC', icon: '▤', color: 'violet'},
    {label: 'Platform earnings', value: data.revenue.commission_records ? money(data.revenue.platform_earnings) : 'Not configured', note: data.revenue.commission_records ? 'Recorded commission ledger' : 'No commission records exist', icon: '%', color: 'amber'},
  ] : [], [data])

  return <>
    <PageHeading title="Overview" description="Current platform activity and database-backed performance." action={<button className="button secondary" onClick={() => setRefresh(value => value + 1)}>↻ Refresh</button>} />
    {error && <Notice kind="error">{error}</Notice>}
    {loading && !data ? <Loading /> : data && <>
      <div className="metric-grid">{cards.map(card => <article className="metric-card" key={card.label}><div className={`metric-icon ${card.color}`}>{card.icon}</div><p>{card.label}</p><strong>{card.value}</strong><small>{card.note}</small></article>)}</div>
      <section className="panel">
        <div className="panel-heading"><div><h2>Account health</h2><p className="muted">Live account status counts from the backend.</p></div><span className="updated">Updated {dateText(data.generated_at)}</span></div>
        <div className="health-grid">
          <HealthGroup title="Users" values={data.users} />
          <HealthGroup title="Drivers" values={data.drivers} />
          <HealthGroup title="Ride statuses" values={data.rides.by_status} />
        </div>
      </section>
    </>}
  </>
}

function HealthGroup({title, values}: {title: string; values: Record<string, number>}) {
  return <div className="health-group"><h3>{title}</h3>{Object.entries(values).map(([label, count]) => <div className="health-row" key={label}><span>{label.replace('_', ' ')}</span><strong>{count}</strong></div>)}</div>
}

function Loading() {
  return <div className="loading-panel"><span className="spinner" />Loading live data…</div>
}

type AccountKind = 'users' | 'drivers'

function AccountsPage({kind}: {kind: AccountKind}) {
  const isDriver = kind === 'drivers'
  const title = isDriver ? 'Driver management' : 'User management'
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
      page, page_size: pageSize, status, search,
      created_from: from ? `${from}T00:00:00Z` : undefined,
      created_to: to ? `${to}T00:00:00Z` : undefined,
      sort_by: sortBy, sort_order: sortOrder,
    }
    try {
      setResult(await api<Page<User | Driver>>(`/admin/${kind}/page?${queryString(values)}`))
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
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 3500); return () => window.clearTimeout(timer) }, [toast])

  async function showDetails(account: User | Driver) {
    const identifier = isDriver ? (account as Driver).driver_id : account._id
    try {
      setDetail(await api<Record<string, unknown>>(`/admin/${kind}/${encodeURIComponent(identifier)}/details`))
    } catch (reason) {
      setToast(reason instanceof Error ? reason.message : 'Could not load account details.')
    }
  }

  async function updateStatus(account: User | Driver, nextStatus: AccountStatus) {
    const current = accountStatus(account)
    if (current === nextStatus) return
    const name = account.name || (account as Driver).driver_id
    if (!window.confirm(`${isDriver && nextStatus === 'active' ? 'Approve and activate' : `Change status to ${nextStatus}`} for ${name}?`)) return
    const identifier = isDriver ? (account as Driver).driver_id : account._id
    try {
      await api(`/admin/${kind}/${encodeURIComponent(identifier)}/status`, {method: 'PATCH', body: JSON.stringify({status: nextStatus})})
      setToast(`${name} is now ${nextStatus}.`)
      setRefresh(value => value + 1)
    } catch (reason) {
      setToast(reason instanceof Error ? reason.message : 'Status could not be changed.')
    }
  }

  function clearFilters() {
    setSearch(''); setStatus(''); setFrom(''); setTo(''); setSortBy('created_at'); setSortOrder('desc'); setPage(1)
  }

  return <>
    <PageHeading title={title} description={isDriver ? 'Review driver registrations, verify vehicle information, and manage account access.' : 'Search users, review their ride activity, and manage account access.'} />
    {toast && <Notice kind="success">{toast}</Notice>}
    <section className="panel">
      <div className="filter-toolbar">
        <input aria-label="Search accounts" placeholder={isDriver ? 'Search name, phone, driver ID, vehicle…' : 'Search name, phone, email…'} value={search} onChange={event => {setSearch(event.target.value); setPage(1)}} />
        <select aria-label="Filter by status" value={status} onChange={event => {setStatus(event.target.value); setPage(1)}}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">{isDriver ? 'Pending / inactive' : 'Inactive'}</option><option value="blocked">Blocked</option></select>
        <label className="date-filter">From<input type="date" value={from} onChange={event => {setFrom(event.target.value); setPage(1)}} /></label>
        <label className="date-filter">To<input type="date" value={to} onChange={event => {setTo(event.target.value); setPage(1)}} /></label>
        <select aria-label="Sort accounts" value={`${sortBy}:${sortOrder}`} onChange={event => {const [field, direction] = event.target.value.split(':'); setSortBy(field); setSortOrder(direction)}}><option value="created_at:desc">Newest first</option><option value="created_at:asc">Oldest first</option><option value="name:asc">Name A–Z</option><option value="name:desc">Name Z–A</option><option value="status:asc">Status</option></select>
        <button className="button ghost" onClick={clearFilters}>Clear</button>
      </div>
      {error && <Notice kind="error">{error}</Notice>}
      {loading && !result ? <Loading /> : <div className="table-wrap"><table><thead><tr><th>Account</th><th>Contact</th>{isDriver && <th>Vehicle / documents</th>}<th>Status</th>{isDriver && <th>Availability</th>}<th>Registered</th><th>Actions</th></tr></thead><tbody>
        {result?.items.map(account => {
          const driver = account as Driver
          return <tr key={isDriver ? driver.driver_id : account._id}>
            <td><button className="text-button" onClick={() => showDetails(account)}>{account.name || 'Unnamed account'}</button><small className="cell-sub">{isDriver ? driver.driver_id : account._id}</small></td>
            <td>{account.phone || account.email || '—'}{account.email && account.phone && <small className="cell-sub">{account.email}</small>}</td>
            {isDriver && <td>{driver.vehicle_type || '—'} · {driver.vehicle_model || 'Vehicle details pending'}<small className="cell-sub">{driver.vehicle_number || 'No registration'} · License {driver.license_number || 'not provided'}</small></td>}
            <td><StatusBadge status={accountStatus(account)} /></td>
            {isDriver && <td><span className={driver.online ? 'live-label' : 'muted'}>{driver.online ? '● Online' : 'Offline'}</span></td>}
            <td>{dateText(account.created_at)}</td>
            <td><div className="action-group">
              <button className="button secondary small" onClick={() => showDetails(account)}>Details</button>
              <select aria-label={`Set status for ${account.name}`} value={accountStatus(account)} onChange={event => updateStatus(account, event.target.value as AccountStatus)}><option value="active">{isDriver && accountStatus(account) === 'inactive' ? 'Approve / activate' : 'Active'}</option><option value="inactive">Deactivate</option><option value="blocked">Block</option></select>
            </div></td>
          </tr>
        })}
        {!loading && !result?.items.length && <tr><td colSpan={isDriver ? 7 : 5}><EmptyState title="No accounts found" message="Try clearing filters or a different search." /></td></tr>}
      </tbody></table></div>}
      {result && <Pagination result={result} pageSize={pageSize} onPage={setPage} onPageSize={size => {setPageSize(size); setPage(1)}} />}
    </section>
    {detail && <DetailModal detail={detail} driver={isDriver} onClose={() => setDetail(null)} />}
  </>
}

function StatusBadge({status}: {status: string}) {
  return <span className={`badge ${status}`}>{status}</span>
}

function EmptyState({title, message}: {title: string; message: string}) {
  return <div className="empty-state"><span>⌕</span><strong>{title}</strong><p>{message}</p></div>
}

function Pagination({result, pageSize, onPage, onPageSize}: {result: Page<unknown>; pageSize: number; onPage: (page: number) => void; onPageSize: (size: number) => void}) {
  return <div className="pagination"><span>{result.total ? `${(result.page - 1) * result.page_size + 1}–${Math.min(result.page * result.page_size, result.total)} of ${result.total}` : '0 records'}</span><label>Rows<select value={pageSize} onChange={event => onPageSize(Number(event.target.value))}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select></label><button className="button ghost small" disabled={result.page <= 1} onClick={() => onPage(result.page - 1)}>Previous</button><span>Page {result.page} of {Math.max(result.total_pages, 1)}</span><button className="button ghost small" disabled={result.page >= result.total_pages} onClick={() => onPage(result.page + 1)}>Next</button></div>
}

function DetailModal({detail, driver, onClose}: {detail: Record<string, unknown>; driver: boolean; onClose: () => void}) {
  const profile = (driver ? detail.driver : detail.user) as Record<string, unknown> | undefined
  const bookings = (detail.bookings || []) as Ride[]
  return <div className="modal-backdrop" onMouseDown={event => {if (event.target === event.currentTarget) onClose()}}><section className="detail-modal"><div className="panel-heading"><div><p className="eyebrow">ACCOUNT DETAILS</p><h2>{String(profile?.name || 'Profile')}</h2></div><button className="button ghost" onClick={onClose}>Close</button></div>
    <div className="detail-grid">{Object.entries(profile || {}).filter(([key, value]) => !key.startsWith('_') && typeof value !== 'object' && key !== 'password_hash').map(([key, value]) => <div key={key}><small>{key.replaceAll('_', ' ')}</small><strong>{String(value ?? '—')}</strong></div>)}</div>
    {driver ? <div className="detail-summary"><span>Recorded earnings<strong>{money(Number(detail.earnings))}</strong></span><span>Completed rides<strong>{String(detail.completed_rides ?? 0)}</strong></span><span>Documents<strong>{profile?.license_number ? 'License on file' : 'No documents submitted'}</strong></span></div> : <div className="detail-summary"><span>Total paid<strong>{money(Number(detail.spending))}</strong></span><span>Paid rides<strong>{String(detail.paid_rides ?? 0)}</strong></span></div>}
    <h3>Recent rides</h3><div className="table-wrap"><table><thead><tr><th>Ride</th><th>Route</th><th>Status</th><th>Fare</th><th>When</th></tr></thead><tbody>{bookings.map(ride => <tr key={ride._id}><td>{ride._id.slice(-8)}</td><td>{ride.pickup_address || '—'} → {ride.destination_address || '—'}</td><td><StatusBadge status={ride.status} /></td><td>{money(ride.fare_amount ?? ride.estimated_fare)}</td><td>{dateText(ride.created_at)}</td></tr>)}{!bookings.length && <tr><td colSpan={5}>No ride records.</td></tr>}</tbody></table></div>
  </section></div>
}

function CabsPage() {
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
      setPageData(await api<Page<Driver>>(`/admin/drivers/page?${queryString({page, page_size: pageSize, search, online: liveOnly ? 'true' : undefined})}`))
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Cabs could not be loaded.')
    } finally { setLoading(false) }
  }, [page, pageSize, search, liveOnly])
  useEffect(() => {
    const timer = window.setTimeout(load, 0)
    return () => window.clearTimeout(timer)
  }, [load, refresh])
  return <>
    <PageHeading title="Cab registry" description="Registered fleet and live availability, sourced from approved driver vehicle profiles." action={<button className="button secondary" onClick={() => setRefresh(value => value + 1)}>↻ Refresh</button>} />
    <section className="panel"><div className="filter-toolbar"><input placeholder="Search vehicle, driver, registration…" value={search} onChange={event => {setSearch(event.target.value); setPage(1)}} /><label className="check-filter"><input type="checkbox" checked={liveOnly} onChange={event => {setLiveOnly(event.target.checked); setPage(1)}} /> Live cabs only</label></div>
      {error && <Notice kind="error">{error}</Notice>}{loading && !pageData ? <Loading /> : <div className="table-wrap"><table><thead><tr><th>Cab</th><th>Driver</th><th>Registration</th><th>Location</th><th>Availability</th><th>Account</th></tr></thead><tbody>{pageData?.items.map(driver => <tr key={driver.driver_id}><td>{driver.vehicle_type || '—'}<small className="cell-sub">{driver.vehicle_model || 'Model not provided'}</small></td><td>{driver.name}<small className="cell-sub">{driver.phone}</small></td><td>{driver.vehicle_number || '—'}</td><td>{driver.latitude != null && driver.longitude != null ? `${driver.latitude.toFixed(5)}, ${driver.longitude.toFixed(5)}` : 'No location'}</td><td><span className={driver.online ? 'live-label' : 'muted'}>{driver.online ? '● Live' : 'Offline'}</span></td><td><StatusBadge status={accountStatus(driver)} /></td></tr>)}{!pageData?.items.length && <tr><td colSpan={6}><EmptyState title="No vehicles found" message="Vehicle details are listed after driver registrations." /></td></tr>}</tbody></table></div>}
      {pageData && <Pagination result={pageData} pageSize={pageSize} onPage={setPage} onPageSize={value => {setPageSize(value); setPage(1)}} />}
    </section>
  </>
}

interface MonitoringDriver extends Driver {
  current_ride: Ride | null
}

interface MonitoringPageData extends Page<MonitoringDriver> {generated_at: string}

function MonitoringPage() {
  const [data, setData] = useState<MonitoringPageData | null>(null)
  const [selected, setSelected] = useState<MonitoringDriver | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    try {
      const result = await api<MonitoringPageData>('/admin/monitoring?page_size=200')
      setData(result)
      setSelected(previous => result.items.find(driver => driver.driver_id === previous?.driver_id) || result.items[0] || null)
      setError('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Live fleet could not be loaded.')
    } finally {setLoading(false)}
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
  const mapUrl = selected?.latitude != null && selected.longitude != null
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${selected.longitude - .02}%2C${selected.latitude - .02}%2C${selected.longitude + .02}%2C${selected.latitude + .02}&layer=mapnik&marker=${selected.latitude}%2C${selected.longitude}`
    : ''
  return <>
    <PageHeading title="Live monitoring" description="Online drivers and assigned rides. Location and ride data refresh every 10 seconds." action={<span className="live-indicator"><i /> REST polling · 10 sec</span>} />
    {error && <Notice kind="error">{error}</Notice>}
    {loading && !data ? <Loading /> : <div className="monitor-grid"><section className="panel map-panel">{selected && mapUrl ? <iframe title={`Live location of ${selected.name}`} src={mapUrl} loading="lazy" /> : <EmptyState title="No live locations" message="Active drivers will appear here when they are online and have shared a location." />}</section><section className="panel monitor-list"><div className="panel-heading"><div><h2>Online drivers</h2><p className="muted">{data?.total ?? 0} drivers reporting</p></div></div><div className="monitor-drivers">{data?.items.map(driver => <button key={driver.driver_id} className={`monitor-driver ${selected?.driver_id === driver.driver_id ? 'selected' : ''}`} onClick={() => setSelected(driver)}><div className="monitor-driver-heading"><strong>{driver.name}</strong><StatusBadge status={driver.current_ride ? (driver.current_ride as Ride).status : 'online'} /></div><span>{driver.vehicle_type} · {driver.vehicle_number || 'No registration'}</span><small>{driver.latitude != null && driver.longitude != null ? `${driver.latitude.toFixed(5)}, ${driver.longitude.toFixed(5)}` : 'Location unavailable'}</small></button>)}{!data?.items.length && <EmptyState title="Fleet offline" message="There are no approved online drivers right now." />}</div></section><section className="panel ride-info"><div className="panel-heading"><div><h2>{selected ? selected.name : 'Current trip'}</h2><p className="muted">{selected?.vehicle_model} · {selected?.vehicle_number}</p></div>{selected && <span className="live-label">● LIVE</span>}</div>{selected && <div className="detail-grid"><div><small>Driver ID</small><strong>{selected.driver_id}</strong></div><div><small>Last location</small><strong>{dateText(selected.last_location_at)}</strong></div>{ride ? <><div><small>Ride status</small><strong>{ride.status}</strong></div><div><small>Rider</small><strong>{String(ride.rider?.name || ride.rider_name || 'Passenger')}</strong></div><div><small>Pickup</small><strong>{ride.pickup_address || '—'}</strong></div><div><small>Dropoff</small><strong>{ride.destination_address || '—'}</strong></div><div><small>Ride started</small><strong>{dateText(ride.started_at)}</strong></div><div><small>Ride ID</small><strong>{ride._id}</strong></div></> : <p className="muted">No accepted or in-progress ride assigned.</p>}</div>}</section></div>}
  </>
}

function RidesPage() {
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
      setResult(await api<Page<Ride>>(`/admin/bookings/page?${queryString({page, page_size: pageSize, status, search, user_id: userId, driver_id: driverId, created_from: from ? `${from}T00:00:00Z` : undefined, created_to: to ? `${to}T00:00:00Z` : undefined, sort_order: sortOrder})}`))
      setError('')
    } catch (reason) {setError(reason instanceof Error ? reason.message : 'Ride records could not be loaded.')}
    finally {setLoading(false)}
  }, [page, pageSize, status, search, userId, driverId, from, to, sortOrder])
  useEffect(() => {
    const timer = window.setTimeout(load, 0)
    return () => window.clearTimeout(timer)
  }, [load, refresh])
  async function showRideDetails(bookingId: string) {
    try {
      setSelectedRide(await api<Record<string, unknown>>(`/admin/bookings/${encodeURIComponent(bookingId)}/details`))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Ride details could not be loaded.')
    }
  }
  function clearFilters() {
    setStatus(''); setSearch(''); setUserId(''); setDriverId(''); setFrom(''); setTo(''); setSortOrder('desc'); setPage(1)
  }
  return <>
    <PageHeading title="Ride management" description="Search and filter ride records, routes, assigned users/drivers, payment state, and fare." action={<button className="button secondary" onClick={() => setRefresh(value => value + 1)}>↻ Refresh</button>} />
    <section className="panel"><div className="filter-toolbar"><input placeholder="Search ride ID…" value={search} onChange={event => {setSearch(event.target.value); setPage(1)}} /><input placeholder="Filter user ID…" value={userId} onChange={event => {setUserId(event.target.value); setPage(1)}} /><input placeholder="Filter driver ID…" value={driverId} onChange={event => {setDriverId(event.target.value); setPage(1)}} /><select value={status} onChange={event => {setStatus(event.target.value); setPage(1)}}><option value="">All statuses</option>{['requested','accepted','in_progress','completed','cancelled'].map(value => <option key={value}>{value}</option>)}</select><select aria-label="Sort rides by date" value={sortOrder} onChange={event => {setSortOrder(event.target.value); setPage(1)}}><option value="desc">Newest first</option><option value="asc">Oldest first</option></select><label className="date-filter">From<input type="date" value={from} onChange={event => {setFrom(event.target.value); setPage(1)}} /></label><label className="date-filter">To<input type="date" value={to} onChange={event => {setTo(event.target.value); setPage(1)}} /></label><button className="button ghost" onClick={clearFilters}>Clear</button></div>
      {error && <Notice kind="error">{error}</Notice>}{loading && !result ? <Loading /> : <div className="table-wrap"><table><thead><tr><th>Ride ID / created</th><th>User</th><th>Driver / cab</th><th>Route</th><th>Status</th><th>Fare / payment</th></tr></thead><tbody>{result?.items.map(ride => <tr key={ride._id}><td><button className="text-button" onClick={() => showRideDetails(ride._id)}>{ride._id}</button><small className="cell-sub">{dateText(ride.created_at)}</small></td><td>{ride.rider_name || ride.user_id}</td><td>{ride.driver_name || ride.driver_id}<small className="cell-sub">{ride.cab_type} · {ride.vehicle_number}</small></td><td>{ride.pickup_address || '—'}<small className="cell-sub">↓ {ride.destination_address || '—'}</small></td><td><StatusBadge status={ride.status} /></td><td>{money(ride.fare_amount ?? ride.estimated_fare)}<small className="cell-sub">{ride.payment_method || '—'} · {ride.payment_status || (ride.status === 'completed' ? 'paid' : 'unpaid')}</small></td></tr>)}{!result?.items.length && <tr><td colSpan={6}><EmptyState title="No rides found" message="Adjust the search or date/status filters." /></td></tr>}</tbody></table></div>}
      {result && <Pagination result={result} pageSize={pageSize} onPage={setPage} onPageSize={value => {setPageSize(value); setPage(1)}} />}
    </section>
    {selectedRide && <RideDetailsModal detail={selectedRide} onClose={() => setSelectedRide(null)} />}
  </>
}

function RideDetailsModal({detail, onClose}: {detail: Record<string, unknown>; onClose: () => void}) {
  const ride = detail.ride as Ride | undefined
  const user = detail.user as User | null
  const driver = detail.driver as Driver | null
  const payment = detail.payment as Record<string, unknown> | null
  return <div className="modal-backdrop" onMouseDown={event => {if (event.target === event.currentTarget) onClose()}}><section className="detail-modal"><div className="panel-heading"><div><p className="eyebrow">RIDE DETAILS</p><h2>{ride?._id || 'Ride'}</h2></div><button className="button ghost" onClick={onClose}>Close</button></div>{ride && <>
    <div className="detail-grid"><div><small>Status</small><strong>{ride.status}</strong></div><div><small>Created</small><strong>{dateText(ride.created_at)}</strong></div><div><small>Started</small><strong>{dateText(ride.started_at)}</strong></div><div><small>Pickup</small><strong>{ride.pickup_address || '—'}</strong></div><div><small>Dropoff</small><strong>{ride.destination_address || '—'}</strong></div><div><small>Cab type / fare</small><strong>{ride.cab_type} · {money(ride.fare_amount ?? ride.estimated_fare)}</strong></div><div><small>Pickup coordinates</small><strong>{ride.pickup_lat}, {ride.pickup_lon}</strong></div><div><small>Dropoff coordinates</small><strong>{ride.destination_lat}, {ride.destination_lon}</strong></div><div><small>Payment</small><strong>{ride.payment_method} · {payment ? 'paid' : ride.status === 'cancelled' ? 'not charged' : 'unpaid'}</strong></div><div><small>Rider</small><strong>{user?.name || ride.rider_name || ride.user_id} · {user?.phone || ''}</strong></div><div><small>Driver</small><strong>{driver?.name || ride.driver_name || ride.driver_id} · {driver?.phone || ''}</strong></div><div><small>Cab registration</small><strong>{driver?.vehicle_number || ride.vehicle_number || '—'}</strong></div></div>
  </>}</section></div>
}

interface RevenueData {
  period: string
  revenue_by_period: { _id: string; revenue: number; rides: number }[]
  driver_earnings: { _id: string; earnings: number; rides: number; driver: Driver }[]
  cab_earnings: { _id: string; earnings: number; rides: number; driver: Driver }[]
}

function RevenuePage() {
  const [period, setPeriod] = useState('day')
  const [data, setData] = useState<RevenueData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)
  const load = useCallback(async () => {
    try {setData(await api<RevenueData>(`/admin/revenue?period=${period}`)); setError('')}
    catch (reason) {setError(reason instanceof Error ? reason.message : 'Revenue data could not be loaded.')}
    finally {setLoading(false)}
  }, [period])
  useEffect(() => {
    const timer = window.setTimeout(load, 0)
    return () => window.clearTimeout(timer)
  }, [load, refresh])
  const max = Math.max(...(data?.revenue_by_period.map(row => row.revenue) || [1]), 1)
  return <>
    <PageHeading title="Revenue & earnings" description="Revenue and driver earnings are calculated from completed ride payment ledger records. Cancelled and unpaid rides are excluded." action={<button className="button secondary" onClick={() => setRefresh(value => value + 1)}>↻ Refresh</button>} />
    <div className="filter-toolbar standalone"><label>Revenue interval<select value={period} onChange={event => setPeriod(event.target.value)}><option value="day">Daily</option><option value="week">Weekly</option><option value="month">Monthly</option></select></label></div>
    {error && <Notice kind="error">{error}</Notice>}{loading && !data ? <Loading /> : data && <>
      <section className="panel"><div className="panel-heading"><div><h2>Revenue by {period}</h2><p className="muted">Recorded cash ride payments, UTC. No synthetic data.</p></div></div>{data.revenue_by_period.length ? <div className="chart" role="img" aria-label={`Revenue by ${period}`}><div className="chart-bars">{data.revenue_by_period.slice(-31).map(row => <div className="bar-column" key={row._id} title={`${row._id}: ${money(row.revenue)} (${row.rides} rides)`}><span className="bar-value">{money(row.revenue)}</span><div className="bar" style={{height: `${Math.max(3, row.revenue / max * 100)}%`}} /><small>{row._id}</small></div>)}</div></div> : <EmptyState title="No paid completed rides yet" message="Revenue charts will populate from completed ride transactions." />}</section>
      <div className="two-panels"><section className="panel"><div className="panel-heading"><div><h2>Driver earnings / payout records</h2><p className="muted">Actual ride_earning ledger transactions.</p></div></div><DataRows rows={data.driver_earnings} /></section><section className="panel"><div className="panel-heading"><div><h2>Cab revenue</h2><p className="muted">Attributed from completed paid ride records.</p></div></div><DataRows rows={data.cab_earnings} cab /></section></div>
      <Notice kind="info">Platform commission is not configured in the current platform ledger. No commission percentage has been assumed or added.</Notice>
    </>}
  </>
}

function DataRows({rows, cab = false}: {rows: RevenueData['driver_earnings']; cab?: boolean}) {
  return <div className="table-wrap"><table><thead><tr><th>{cab ? 'Vehicle' : 'Driver'}</th><th>Registered driver</th><th>Completed rides</th><th>Recorded total</th></tr></thead><tbody>{rows.map(row => <tr key={row._id}><td>{cab ? `${row.driver?.vehicle_type || 'Cab'} ${row.driver?.vehicle_number || ''}` : row.driver?.name || row._id}</td><td>{row.driver?.name || row._id}</td><td>{row.rides}</td><td>{money(row.earnings)}</td></tr>)}{!rows.length && <tr><td colSpan={4}>No earnings have been recorded.</td></tr>}</tbody></table></div>
}

function AdminApp() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '')
  const logout = useCallback(() => {
    localStorage.removeItem('adminToken')
    setToken('')
  }, [])
  return <BrowserRouter><Routes>
    <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage onLogin={setToken} />} />
    <Route element={token ? <ProtectedLayout onLogout={logout} /> : <Navigate to="/login" replace />}>
      <Route index element={<DashboardPage />} />
      <Route path="users" element={<AccountsPage kind="users" />} />
      <Route path="drivers" element={<AccountsPage kind="drivers" />} />
      <Route path="cabs" element={<CabsPage />} />
      <Route path="monitoring" element={<MonitoringPage />} />
      <Route path="rides" element={<RidesPage />} />
      <Route path="revenue" element={<RevenuePage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter>
}

export default AdminApp
