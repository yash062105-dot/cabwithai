export type AccountStatus = 'active' | 'inactive' | 'blocked'

export interface Page<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface User {
  _id: string
  name: string
  phone?: string
  email?: string
  role: string
  status?: AccountStatus
  created_at?: string
}

export interface Driver extends User {
  driver_id: string
  vehicle_type?: string
  vehicle_model?: string
  vehicle_number?: string
  license_number?: string
  online?: boolean
  available?: boolean
  latitude?: number
  longitude?: number
  last_location_at?: string
}

export interface Ride {
  _id: string
  user_id: string
  driver_id: string
  rider_name?: string
  driver_name?: string
  vehicle_number?: string
  cab_type?: string
  pickup_address?: string
  destination_address?: string
  pickup_lat?: number
  pickup_lon?: number
  destination_lat?: number
  destination_lon?: number
  status: string
  estimated_fare?: number
  fare_amount?: number
  payment_method?: string
  payment_status?: string
  created_at?: string
  started_at?: string
  rider?: { name?: string; phone?: string } | null
}

export interface DashboardData {
  users: Record<'total' | 'active' | 'inactive' | 'blocked', number>
  drivers: Record<'total' | 'active' | 'inactive' | 'blocked', number>
  cabs: { total: number; live: number }
  rides: {
    total: number
    ongoing: number
    completed: number
    cancelled: number
    by_status: Record<string, number>
  }
  revenue: {
    total: number
    today: number
    month: number
    platform_earnings: number
    commission_records: boolean
  }
  generated_at: string
}

export interface MonitoringDriver extends Driver {
  current_ride: Ride | null
}

export interface MonitoringPageData extends Page<MonitoringDriver> {
  generated_at: string
}

export interface RevenueData {
  period: string
  revenue_by_period: { _id: string; revenue: number; rides: number }[]
  driver_earnings: { _id: string; earnings: number; rides: number; driver: Driver }[]
  cab_earnings: { _id: string; earnings: number; rides: number; driver: Driver }[]
}
