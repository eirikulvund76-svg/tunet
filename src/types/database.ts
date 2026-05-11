// types/database.ts — Auto-generates from Supabase CLI: npx supabase gen types typescript

export type BookingStatus = 'pending' | 'confirmed' | 'paid' | 'cancelled' | 'completed'
export type BookingPlatform = 'airbnb' | 'booking' | 'direct' | 'other'
export type Priority = 'high' | 'medium' | 'low'
export type DamageStatus = 'open' | 'in_progress' | 'resolved'
export type InventoryCategory = 'consumable' | 'textile' | 'equipment' | 'cleaning'
export type Room = 'soverom' | 'bad' | 'kjøkken' | 'stove' | 'gang' | 'utvendig' | 'anna'
export type EconomyType = 'income' | 'expense'

export interface Booking {
  id: string
  guest_name: string
  check_in: string          // ISO date string
  check_out: string
  num_guests: number
  price_per_night: number
  cleaning_fee: number
  notes: string | null
  status: BookingStatus
  platform: BookingPlatform
  created_at: string
  updated_at: string
}

export interface TurnoverTask {
  id: string
  name: string
  description: string | null
  est_minutes: number
  sort_order: number
  is_active: boolean
}

export interface Turnover {
  id: string
  booking_id: string | null
  scheduled_date: string
  completed_at: string | null
  notes: string | null
  created_at: string
}

export interface TurnoverTaskLog {
  id: string
  turnover_id: string
  task_id: string
  completed: boolean
  completed_at: string | null
  completed_by: string | null
  notes: string | null
  // Joined
  task?: TurnoverTask
}

export interface InventoryItem {
  id: string
  name: string
  category: InventoryCategory
  unit: string
  current_qty: number
  min_qty: number
  max_qty: number
  notes: string | null
  updated_at: string
}

export interface DamageReport {
  id: string
  booking_id: string | null
  turnover_id: string | null
  room: Room
  description: string
  priority: Priority
  status: DamageStatus
  images: string[]
  repair_cost: number | null
  resolved_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface EconomyEntry {
  id: string
  booking_id: string | null
  type: EconomyType
  category: string
  amount: number
  description: string | null
  date: string
  created_at: string
}

// View types
export interface BookingEconomics extends Booking {
  nights: number
  room_revenue: number
  gross_revenue: number
}

export interface MonthlyEconomy {
  month: string
  total_income: number
  total_expenses: number
  net: number
}

export interface BookingPnl {
  id: string
  guest_name: string
  check_in: string
  check_out: string
  income: number
  expenses: number
  net: number
}
