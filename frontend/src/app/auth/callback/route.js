import { NextResponse } from 'next/server'
import { createClient } from '../../utils/supabase/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  
  // Default redirect to dashboard after successful auth
  let next = searchParams.get('next') ?? '/dashboard'
  if (!next.startsWith('/')) {
    next = '/dashboard'
  }

  // If there's an OAuth error, redirect to signin with error
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    const redirectUrl = new URL('/signIn', origin)
    redirectUrl.searchParams.set('error', error)
    redirectUrl.searchParams.set('error_description', errorDescription || 'Authentication failed')
    return NextResponse.redirect(redirectUrl.toString())
  }

  if (code) {
    try {
      const supabase = createClient()
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        const redirectUrl = new URL('/signIn', origin)
        redirectUrl.searchParams.set('error', 'auth_error')
        redirectUrl.searchParams.set('error_description', exchangeError.message)
        return NextResponse.redirect(redirectUrl.toString())
      }

      if (data.session) {
        // Successful authentication
        const forwardedHost = request.headers.get('x-forwarded-host')
        const isLocalEnv = process.env.NODE_ENV === 'development'
        
        let redirectUrl
        if (isLocalEnv) {
          redirectUrl = `${origin}${next}`
        } else if (forwardedHost) {
          redirectUrl = `https://${forwardedHost}${next}`
        } else {
          redirectUrl = `${origin}${next}`
        }
        
        console.log('Authentication successful, redirecting to:', redirectUrl)
        return NextResponse.redirect(redirectUrl)
      }
    } catch (err) {
      console.error('Unexpected error during auth callback:', err)
    }
  }

  // If no code or authentication failed, redirect to signin with error
  const redirectUrl = new URL('/signIn', origin)
  redirectUrl.searchParams.set('error', 'missing_code')
  redirectUrl.searchParams.set('error_description', 'No authorization code received')
  return NextResponse.redirect(redirectUrl.toString())
}
