import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  // Sjekk at requesten kjem frå Vercel Cron (sikkerheit)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Hent alle brukarprofilar med ein ical_url sett
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('id, ical_url')
    .not('ical_url', 'is', null)
    .neq('ical_url', '')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results: { user_id: string; created: number; skipped: number; errors: number }[] = []

  for (const profile of profiles ?? []) {
    try {
      const icsRes = await fetch(profile.ical_url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      })
      if (!icsRes.ok) {
        results.push({ user_id: profile.id, created: 0, skipped: 0, errors: 1 })
        continue
      }
      const icsText = await icsRes.text()
      const events = parseIcal(icsText)
      const bookings = events.filter(e =>
        e.summary &&
        !e.summary.toLowerCase().includes('not available') &&
        e.start !== e.end
      )

      let created = 0, skipped = 0, errors = 0

      for (const event of bookings) {
        try {
          const { data: existing } = await supabase
            .from('bookings')
            .select('id')
            .eq('user_id', profile.id)
            .eq('check_in', event.start)
            .eq('check_out', event.end)
            .neq('status', 'cancelled')
            .maybeSingle()

          if (existing) {
            await supabase
              .from('bookings')
              .update({ ical_uid: event.uid, source: 'airbnb_ical' })
              .eq('id', existing.id)
            skipped++
            continue
          }

          await supabase.from('bookings').insert({
            guest_name: event.summary || 'Airbnb-gjest',
            check_in: event.start,
            check_out: event.end,
            num_guests: 1,
            price_per_night: 0,
            cleaning_fee: 0,
            status: 'confirmed',
            platform: 'airbnb',
            source: 'airbnb_ical',
            ical_uid: event.uid,
            user_id: profile.id,
            notes: 'Importert automatisk frå Airbnb iCal (nattleg sync)',
          })
          created++
        } catch {
          errors++
        }
      }

      results.push({ user_id: profile.id, created, skipped, errors })
    } catch {
      results.push({ user_id: profile.id, created: 0, skipped: 0, errors: 1 })
    }
  }

  return NextResponse.json({ ok: true, results })
}

type ICalEvent = { uid: string; summary: string; start: string; end: string }

function parseIcal(icsText: string): ICalEvent[] {
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
        current.start = parseIcalDate(line.split(':').slice(1).join(':').trim())
      } else if (line.startsWith('DTEND')) {
        current.end = parseIcalDate(line.split(':').slice(1).join(':').trim())
      } else if (line.startsWith('SUMMARY:')) {
        current.summary = line.replace('SUMMARY:', '').trim()
      }
    }
  }
  return events
}

function parseIcalDate(val: string): string {
  const clean = val.replace(/[TZ]/g, '')
  return `${clean.slice(0,4)}-${clean.slice(4,6)}-${clean.slice(6,8)}`
}
