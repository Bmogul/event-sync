
'use client'
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import styles from "./page.module.css"
import Branding from "./components/sections/Branding";
import AuthForm from "./components/sections/Form";
import { createClient } from "../utils/supabase/client";

const SignInContent = () => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Add auth-page class to body for background styling
    document.body.classList.add('auth-page')
    
    // Check for auth errors from callback
    const authError = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    if (authError) {
      let errorMessage = 'Authentication failed'
      
      switch (authError) {
        case 'access_denied':
          errorMessage = 'Access denied. Please try again.'
          break
        case 'auth_error':
          errorMessage = errorDescription || 'Authentication error occurred'
          break
        case 'missing_code':
          errorMessage = 'Authorization failed. Please try again.'
          break
        default:
          errorMessage = errorDescription || 'An error occurred during sign in'
      }
      
      setError(errorMessage)
    }

    // Check current auth state
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        router.push('/dashboard')
      }
    }
    
    checkAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user)
        router.push('/dashboard')
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('auth-page')
      subscription.unsubscribe()
    }
  }, [router, searchParams, supabase.auth])

  const switchTab = (tab) => {
    setIsSignUp(tab === 'signup')
    setError(null) // Clear errors when switching tabs
  }

  const handleSocialLogin = async (provider, formData) => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })
      
      if (error) {
        console.error('OAuth error:', error.message)
        setError(error.message || `Failed to sign in with ${provider}`)
        setIsLoading(false)
      }
      // Note: If successful, the user will be redirected, so we don't set loading to false here
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return(
    <div className={`${styles.authContainer} ${styles.fadeIn}`}>
      <Branding />
      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
          <button 
            onClick={() => setError(null)} 
            className={styles.errorClose}
          >
            ×
          </button>
        </div>
      )}
      <AuthForm 
        isSignUp={isSignUp}
        onSwitchTab={switchTab}
        onSocialLogin={handleSocialLogin}
        isLoading={isLoading}
        error={error}
      />
    </div>
  )
}

const SignIn = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
};

export default SignIn;
