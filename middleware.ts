import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Sider som ikkje krev innlogging
const PUBLIC_PATHS = ['/', '/login', '/landing']

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Alltid vis desse sidene utan å sjekke innlogging
  if (PUBLIC_PATHS.includes(path)) {
    return NextResponse.next()
  }

  // Alt anna krev innlogging
  const token = req.cookies.get('sb-aqrmxxzznonivkevtctp-auth-token')
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
