import { api } from './api'
import { queryString } from '../utils/formatters'
import type {
  DashboardData,
  Driver,
  MonitoringPageData,
  Page,
  RevenueData,
  Ride,
  User,
  AccountStatus,
} from '../types'

export const adminService = {
  // Auth
  async login(credentials: { email: string; password: string }) {
    return api<{ access_token: string; user: User }>('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  },

  async getCurrentUser() {
    return api<User>('/auth/me')
  },

  // Dashboard
  async getDashboard() {
    return api<DashboardData>('/admin/dashboard')
  },

  // Users & Drivers
  async getAccounts(kind: 'users' | 'drivers', params: Record<string, string | number | boolean | undefined>) {
    return api<Page<User | Driver>>(`/admin/${kind}/page?${queryString(params)}`)
  },

  async getAccountDetails(kind: 'users' | 'drivers', id: string) {
    return api<Record<string, unknown>>(`/admin/${kind}/${encodeURIComponent(id)}/details`)
  },

  async updateAccountStatus(kind: 'users' | 'drivers', id: string, status: AccountStatus) {
    return api(`/admin/${kind}/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },

  // Cabs
  async getCabs(params: { page: number; page_size: number; search?: string; online?: string }) {
    return api<Page<Driver>>(`/admin/drivers/page?${queryString(params)}`)
  },

  // Live Monitoring
  async getMonitoringFleet(pageSize = 200) {
    return api<MonitoringPageData>(`/admin/monitoring?page_size=${pageSize}`)
  },

  // Rides / Bookings
  async getRides(params: Record<string, string | number | undefined>) {
    return api<Page<Ride>>(`/admin/bookings/page?${queryString(params)}`)
  },

  async getRideDetails(bookingId: string) {
    return api<Record<string, unknown>>(`/admin/bookings/${encodeURIComponent(bookingId)}/details`)
  },

  // Revenue
  async getRevenue(period: string) {
    return api<RevenueData>(`/admin/revenue?period=${encodeURIComponent(period)}`)
  },
}
