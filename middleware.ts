import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login']

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Landingsside og login er alltid opne
  if (PUBLIC_PATHS.includes(path)) {
    return NextResponse.next()
  }

  // Sjekk om brukar har Supabase auth-cookie
  const token = req.cookies.get('sb-aqrmxxzznonivkevtctp-auth-token')
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
