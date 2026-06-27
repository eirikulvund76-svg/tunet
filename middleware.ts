import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  const path = req.nextUrl.pathname

  // Landingsside og login er alltid opne
  if (PUBLIC_PATHS.includes(path)) {
    // Viss innlogga og går til /login, send til dashboard
    if (session && path === '/login') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return res
  }

  // Alt anna krev innlogging
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
