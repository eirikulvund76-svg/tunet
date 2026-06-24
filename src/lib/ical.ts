// src/lib/ical.ts — Hentar og parser iCal-filer frå Airbnb

import { supabase } from './supabase'

type ICalEvent = {
  uid: string
  summary: string
  start: string
  end: string
}

export function parseIcal(icsText: string): ICalEvent[] {
  const events: ICalEvent[] = []
  const lines = icsText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  let current: Partial<ICalEvent> | null = null

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {}
    } else if (line === 'END:VEVENT') {
      if (current?.uid && current?.start && current?.end) {
        events.push(current as ICalEvent)
      }
      current = null
    } else if (current !== null) {
      if (line.startsWith('UID:')) {
        current.uid = line.replace('UID:', '').trim()
      } else if (line.startsWith('DTSTART')) {
        const val = line.split(':').slice(1).join(':').trim()
        current.start = parseIcalDate(val)
      } else if (line.startsWith('DTEND')) {
        const val = line.split(':').slice(1).join(':').trim()
        current.end = parseIcalDate(val)
      } else if (line.startsWith('SUMMARY:')) {
        current.summary = line.replace('SUMMARY:', '').trim()
      }
    }
  }
  return events
}

function parseIcalDate(val: string): string {
  const clean = val.replace(/[TZ]/g, '')
  const year  = clean.slice(0, 4)
  const month = clean.slice(4, 6)
  const day   = clean.slice(6, 8)
  return `${year}-${month}-${day}`
}

async function fetchIcal(url: string): Promise<string> {
  const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
  const res = await fetch(proxy)
  if (!res.ok) throw new Error('Klarte ikkje hente iCal-lenka')
  const data = await res.json()
  return data.contents
}

export async function syncIcalBookings(icalUrl: string): Promise<{
  created: number
  skipped: number
  errors: number
}> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Ikkje innlogga')

  const userId = session.user.id
  let created = 0, skipped = 0, errors = 0

  // Hent iCal
  const icsText = await fetchIcal(icalUrl)

  // Parse
  const events = parseIcal(icsText)

  // Filtrer vekk "Not available" og tomme oppføringar
  const bookings = events.filter(e =>
    e.summary &&
    !e.summary.toLowerCase().includes('not available') &&
    !e.summary.toLowerCase().includes('airbnb (not available)') &&
    e.start !== e.end
  )

  for (const event of bookings) {
    try {
      // Sjekk om booking med same dato allereie finst
      const { data: existing } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', userId)
        .eq('check_in', event.start)
        .eq('check_out', event.end)
        .neq('status', 'cancelled')
        .single()

      if (existing) {
        // Oppdater ical_uid viss han manglar
        await supabase
          .from('bookings')
          .update({ ical_uid: event.uid, source: 'airbnb_ical' })
          .eq('id', existing.id)
        skipped++
        continue
      }

      // Lag ny booking
      await supabase.from('bookings').insert({
        guest_name:      event.summary || 'Airbnb-gjest',
        check_in:        event.start,
        check_out:       event.end,
        num_guests:      1,
        price_per_night: 0,
        cleaning_fee:    0,
        status:          'confirmed',
        platform:        'airbnb',
        source:          'airbnb_ical',
        ical_uid:        event.uid,
        user_id:         userId,
        notes:           'Importert automatisk frå Airbnb iCal'
      })
      created++
    } catch {
      errors++
    }
  }

  return { created, skipped, errors }
}
