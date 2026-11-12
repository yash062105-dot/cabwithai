import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

// Lazy loaded page components for optimal production chunking
const LoginPage = lazy(() =>
  import('../pages/login/LoginPage').then((m) => ({ default: m.LoginPage }))
)
const DashboardPage = lazy(() =>
  import('../pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
)
const AccountsPage = lazy(() =>
  import('../pages/accounts/AccountsPage').then((m) => ({ default: m.AccountsPage }))
)
const CabsPage = lazy(() =>
  import('../pages/cabs/CabsPage').then((m) => ({ default: m.CabsPage }))
)
const MonitoringPage = lazy(() =>
  import('../pages/monitoring/MonitoringPage').then((m) => ({ default: m.MonitoringPage }))
)
const RidesPage = lazy(() =>
  import('../pages/rides/RidesPage').then((m) => ({ default: m.RidesPage }))
)
const RevenuePage = lazy(() =>
  import('../pages/revenue/RevenuePage').then((m) => ({ default: m.RevenuePage }))
)

interface AppRoutesProps {
  token: string
  onLogin: (token: string) => void
  onLogout: () => void
}

export function AppRoutes({ token, onLogin, onLogout }: AppRoutesProps) {
  return (
    <Suspense fallback={<LoadingSpinner label="Loading view..." fullScreen />}>
      <Routes>
        {/* Auth Route */}
        <Route
          path="/login"
          element={token ? <Navigate to="/" replace /> : <LoginPage onLogin={onLogin} />}
        />

        {/* Protected Admin Console Routes */}
        <Route
          element={token ? <AdminLayout onLogout={onLogout} /> : <Navigate to="/login" replace />}
        >
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<AccountsPage kind="users" />} />
          <Route path="drivers" element={<AccountsPage kind="drivers" />} />
          <Route path="cabs" element={<CabsPage />} />
          <Route path="monitoring" element={<MonitoringPage />} />
          <Route path="rides" element={<RidesPage />} />
          <Route path="revenue" element={<RevenuePage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
