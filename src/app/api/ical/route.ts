import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Mangler url-parameter' }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      return NextResponse.json({ error: `Fetch feila: ${response.status}` }, { status: 502 })
    }

    const text = await response.text()
    return new NextResponse(text, {
      headers: {
        'Content-Type': 'text/calendar',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Kunne ikkje hente iCal-fil' }, { status: 500 })
  }
}
