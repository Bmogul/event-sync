import { NextResponse } from 'next/server'

const BASE64_PREFIX = 'base64-'

function decodeBase64Url(str) {
  // Standard base64url → base64 → binary → UTF-8, Edge Runtime compatible
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function getSessionUser(request) {
  try {
    // Derive cookie key the same way @supabase/supabase-js does:
    // `sb-${hostname.split('.')[0]}-auth-token`
    const { hostname } = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
    const key = `sb-${hostname.split('.')[0]}-auth-token`

    // Try primary cookie (non-chunked), then chunked (.0, .1, …)
    let raw = request.cookies.get(key)?.value ?? null
    if (!raw) {
      const chunks = []
      for (let i = 0; ; i++) {
        const chunk = request.cookies.get(`${key}.${i}`)?.value
        if (!chunk) break
        chunks.push(chunk)
      }
      if (chunks.length > 0) raw = chunks.join('')
    }
    if (!raw) return null

    // Decode: strip "base64-" prefix then base64url-decode; fall back to URL-decode
    const jsonStr = raw.startsWith(BASE64_PREFIX)
      ? decodeBase64Url(raw.slice(BASE64_PREFIX.length))
      : decodeURIComponent(raw)

    const session = JSON.parse(jsonStr)
    return session?.user ?? null
  } catch {
    return null // Malformed cookie → treat as unauthenticated
  }
}

export async function middleware(request) {
  // No createServerClient — no network call, no GoTrueClient initialization.
  // This avoids the `fetch failed` errors caused by _emitInitialSession()
  // unconditionally calling _callRefreshToken() on every request in the
  // Next.js 15 Edge Runtime sandbox.
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const user = getSessionUser(request)

  // Add user info to response headers for client-side access
  if (user) {
    response.headers.set('x-user-id', user.id)
    response.headers.set('x-user-email', user.email || '')
  }

  // If user is not signed in and the current path is not already the signin page,
  // redirect the user to the signin page.
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/signIn'
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is signed in and the current path is signin, redirect to dashboard
  if (user && request.nextUrl.pathname.startsWith('/signIn')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
