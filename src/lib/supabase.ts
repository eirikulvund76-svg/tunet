// lib/supabase.ts — Supabase client + all data access helpers
import { createClient } from '@supabase/supabase-js'
import type {
  Booking, Turnover, TurnoverTask, TurnoverTaskLog,
  InventoryItem, DamageReport, EconomyEntry,
  MonthlyEconomy, BookingPnl, BookingStatus
} from '@/types/database'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
export const supabase = createClient(supabaseUrl, supabaseKey)

// ─── BOOKINGS ────────────────────────────────────────────────

export async function getBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('check_in', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getNextBooking(): Promise<Booking | null> {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .gte('check_in', today)
    .neq('status', 'cancelled')
    .order('check_in', { ascending: true })
    .limit(1)
    .single()
  if (error) return null
  return data
}

export async function getBookingsForMonth(year: number, month: number): Promise<Booking[]> {
  const start = `${year}-${String(month).padStart(2,'0')}-01`
  const end   = new Date(year, month, 0).toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .lte('check_in', end)
    .gte('check_out', start)
    .neq('status', 'cancelled')
  if (error) throw error
  return data ?? []
}

export async function createBooking(booking: Omit<Booking, 'id'|'created_at'|'updated_at'>): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .insert(booking)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
  const { error } = await supabase.from('bookings').update({ status }).eq('id', id)
  if (error) throw error
}

export async function deleteBooking(id: string): Promise<void> {
  const { error } = await supabase.from('bookings').delete().eq('id', id)
  if (error) throw error
}

// ─── TURNOVER ────────────────────────────────────────────────

export async function getTurnoverTasks(): Promise<TurnoverTask[]> {
  const { data, error } = await supabase
    .from('turnover_tasks')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function createTurnover(bookingId: string | null, date: string): Promise<Turnover> {
  // 1) Create turnover session
  const { data: turnover, error: te } = await supabase
    .from('turnovers')
    .insert({ booking_id: bookingId, scheduled_date: date })
    .select()
    .single()
  if (te) throw te

  // 2) Create task log entries from all active tasks
  const tasks = await getTurnoverTasks()
  const taskLogs = tasks.map(t => ({
    turnover_id: turnover.id,
    task_id: t.id,
    completed: false
  }))
  const { error: le } = await supabase.from('turnover_task_log').insert(taskLogs)
  if (le) throw le

  return turnover
}

export async function getTurnoverWithTasks(turnoverId: string): Promise<{
  turnover: Turnover
  tasks: TurnoverTaskLog[]
}> {
  const { data: turnover, error: te } = await supabase
    .from('turnovers')
    .select('*')
    .eq('id', turnoverId)
    .single()
  if (te) throw te

  const { data: tasks, error: le } = await supabase
    .from('turnover_task_log')
    .select('*, task:turnover_tasks(*)')
    .eq('turnover_id', turnoverId)
    .order('task(sort_order)')
  if (le) throw le

  return { turnover, tasks: tasks ?? [] }
}

export async function toggleTurnoverTask(logId: string, completed: boolean): Promise<void> {
  const { error } = await supabase
    .from('turnover_task_log')
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null
    })
    .eq('id', logId)
  if (error) throw error
}

export async function completeTurnover(turnoverId: string): Promise<void> {
  const { error } = await supabase
    .from('turnovers')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', turnoverId)
  if (error) throw error
}

// ─── INVENTORY ───────────────────────────────────────────────

export async function getInventory(): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('category')
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function getLowStockItems(): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('low_stock_items')
    .select('*')
  if (error) throw error
  return data ?? []
}

export async function updateInventoryQty(
  itemId: string,
  newQty: number,
  reason: string,
  turnoverId?: string
): Promise<void> {
  // Get current qty
  const { data: item, error: ge } = await supabase
    .from('inventory_items')
    .select('current_qty')
    .eq('id', itemId)
    .single()
  if (ge) throw ge

  const delta = newQty - item.current_qty

  // Update item
  const { error: ue } = await supabase
    .from('inventory_items')
    .update({ current_qty: newQty })
    .eq('id', itemId)
  if (ue) throw ue

  // Log transaction
  await supabase.from('inventory_transactions').insert({
    item_id: itemId,
    delta,
    reason,
    turnover_id: turnoverId ?? null
  })
}

// ─── DAMAGE REPORTS ──────────────────────────────────────────

export async function getDamageReports(status?: string): Promise<DamageReport[]> {
  let query = supabase.from('damage_reports').select('*').order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createDamageReport(
  report: Omit<DamageReport, 'id'|'created_at'|'updated_at'>
): Promise<DamageReport> {
  const { data, error } = await supabase
    .from('damage_reports')
    .insert(report)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateDamageStatus(
  id: string,
  status: DamageReport['status'],
  repairCost?: number
): Promise<void> {
  const { error } = await supabase
    .from('damage_reports')
    .update({
      status,
      repair_cost: repairCost,
      resolved_at: status === 'resolved' ? new Date().toISOString() : null
    })
    .eq('id', id)
  if (error) throw error
}

export async function uploadDamageImage(file: File): Promise<string> {
  const path = `damage/${Date.now()}-${file.name}`
  const { error } = await supabase.storage.from('damage-images').upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('damage-images').getPublicUrl(path)
  return data.publicUrl
}

// ─── ECONOMY ─────────────────────────────────────────────────

export async function getEconomyEntries(year: number, month: number): Promise<EconomyEntry[]> {
  const start = `${year}-${String(month).padStart(2,'0')}-01`
  const end   = new Date(year, month, 0).toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('economy_entries')
    .select('*')
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getMonthlySummary(months = 12): Promise<MonthlyEconomy[]> {
  const { data, error } = await supabase
    .from('monthly_economy')
    .select('*')
    .limit(months)
  if (error) throw error
  return data ?? []
}

export async function getBookingPnl(): Promise<BookingPnl[]> {
  const { data, error } = await supabase
    .from('booking_pnl')
    .select('*')
    .limit(20)
  if (error) throw error
  return data ?? []
}

export async function createEconomyEntry(
  entry: Omit<EconomyEntry, 'id'|'created_at'>
): Promise<EconomyEntry> {
  const { data, error } = await supabase
    .from('economy_entries')
    .insert(entry)
    .select()
    .single()
  if (error) throw error
  return data
}

// Auto-create economy entries when a booking is confirmed
export async function createBookingEconomyEntries(booking: Booking): Promise<void> {
  const nights = Math.ceil(
    (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime())
    / (1000 * 60 * 60 * 24)
  )
  await supabase.from('economy_entries').insert([
    {
      booking_id: booking.id,
      type: 'income',
      category: 'booking_revenue',
      amount: nights * booking.price_per_night,
      description: `${booking.guest_name} · ${nights} netter`,
      date: booking.check_in
    },
    {
      booking_id: booking.id,
      type: 'income',
      category: 'cleaning_fee',
      amount: booking.cleaning_fee,
      description: `Vaskegebyr — ${booking.guest_name}`,
      date: booking.check_in
    }
  ])
}
