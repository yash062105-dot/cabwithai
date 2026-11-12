import { useState, useEffect } from 'react'
import { NavLink, Outlet, Navigate } from 'react-router-dom'
import { adminService } from '../services/adminService'
import { ApiError } from '../services/api'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Car,
  Activity,
  ArrowLeftRight,
  TrendingUp,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react'

interface AdminLayoutProps {
  onLogout: () => void
}

export function AdminLayout({ onLogout }: AdminLayoutProps) {
  const [checking, setChecking] = useState(true)
  const [valid, setValid] = useState(false)
  const [name, setName] = useState('Admin')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    adminService
      .getCurrentUser()
      .then((profile) => {
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

  if (checking) {
    return <LoadingSpinner label="Validating administrator session..." fullScreen />
  }

  if (!valid) {
    return <Navigate to="/login" replace />
  }

  const navigation = [
    { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/users', label: 'Users', icon: Users },
    { to: '/drivers', label: 'Drivers & Approvals', icon: ShieldCheck },
    { to: '/cabs', label: 'Cab Registry', icon: Car },
    { to: '/monitoring', label: 'Live Monitoring', icon: Activity },
    { to: '/rides', label: 'Ride Operations', icon: ArrowLeftRight },
    { to: '/revenue', label: 'Revenue & Earnings', icon: TrendingUp },
  ]

  const userInitials = (name || 'A')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="h-screen flex bg-slate-50 text-slate-900 font-sans antialiased overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - fixed on desktop and mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:h-screen lg:shrink-0`}
      >
        {/* Brand */}
        <div className="h-18 px-6 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-600/30">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-base text-white tracking-wide flex items-center gap-1.5">
                CAB CONTROL
                <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-sm">
                  PRO
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">
                Operations Platform
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Workspace
            </p>
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-4 h-4 transition-colors ${
                              isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-slate-300">Live API Linked</span>
            </div>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-30 min-h-18 bg-white/90
        
        backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 
        flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="hover:text-slate-700">Administration</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900 font-semibold">Operations Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-700 font-bold text-xs flex items-center justify-center">
                {userInitials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">{name}</p>
                <p className="text-[10px] font-medium text-slate-500 capitalize">Super Admin</p>
              </div>
              <button
                onClick={onLogout}
                title="Sign out"
                className="ml-2 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
