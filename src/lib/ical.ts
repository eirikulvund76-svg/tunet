// src/lib/ical.ts — Hentar og parser iCal-filer frå Airbnb

import { supabase } from './supabase'

type ICalEvent = {
  uid: string
  summary: string
  start: string   // ISO date string
  end: string     // ISO date string
}

/**
 * Enkel iCal-parser — les .ics-format og returnerer events
 */
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

/**
 * Konverterer iCal-datoformat (20250615 eller 20250615T120000Z) til ISO-string
 */
function parseIcalDate(val: string): string {
  const clean = val.replace(/[TZ]/g, '')
  const year  = clean.slice(0, 4)
  const month = clean.slice(4, 6)
  const day   = clean.slice(6, 8)
  return `${year}-${month}-${day}`
}

/**
 * Hentar iCal-lenka via CORS-proxy og returnerer rå tekst
 */
async function fetchIcal(url: string): Promise<string> {
  // Brukar ein open CORS-proxy sidan Airbnb ikkje har CORS-headers
  const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
  const res = await fetch(proxy)
  if (!res.ok) throw new Error('Klarte ikkje hente iCal-lenka')
  const data = await res.json()
  return data.contents
}

/**
 * Hovudfunksjon — hentar iCal og synkroniserer med Supabase
 */
export async function syncIcalBookings(icalUrl: string): Promise<{
  created: number
  skipped: number
  errors: number
}> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Ikkje innlogga')

  const userId = session.user.id
  let created = 0, skipped = 0, errors = 0

  // 1) Hent iCal
  const icsText = await fetchIcal(icalUrl)

  // 2) Parse
  const events = parseIcal(icsText)

  // 3) Filtrer vekk "Not available" og tomme oppføringar
  const bookings = events.filter(e =>
    e.summary &&
    !e.summary.toLowerCase().includes('not available') &&
    !e.summary.toLowerCase().includes('airbnb (not available)') &&
    e.start !== e.end
  )

  // 4) For kvar booking — upsert i Supabase
  for (const event of bookings) {
    try {
      // Sjekk om den allereie finst
      const { data: existing } = await supabase
        .from('bookings')
        .select('id')
        .eq('ical_uid', event.uid)
        .eq('user_id', userId)
        .single()

      if (existing) {
        skipped++
        continue
      }

      // Lag ny booking
      await supabase.from('bookings').insert({
        guest_name:      event.summary || 'Airbnb-gjest',
        check_in:        event.start,
        check_out:       event.end,
        num_guests:      1,
        price_per_night: 0,   // Ukjent frå iCal
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
