'use client'

import { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { createClient } from '../utils/supabase/client'

const AuthContext = createContext()

export const AuthProvider = ({ children, value: testValue }) => {
  // If testValue is provided (for testing), use it directly
  if (testValue) {
    return (
      <AuthContext.Provider value={testValue}>
        {children}
      </AuthContext.Provider>
    )
  }

  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState(null)
  
  // Memoize supabase client to prevent recreation
  const supabase = useMemo(() => createClient(), [])
  
  // Refs to track ongoing operations and prevent race conditions
  const profileFetchRef = useRef(null)
  const retryTimeoutRef = useRef(null)
  const mountedRef = useRef(true)

  // Function to fetch user profile with retry logic and timeout
  const fetchUserProfile = useCallback(async (userId, retryCount = 0) => {
    const maxRetries = 2
    const timeoutMs = 5000
    
    // Prevent multiple simultaneous fetches
    if (profileFetchRef.current?.userId === userId) {
      return profileFetchRef.current.promise
    }
    
    const fetchPromise = async () => {
      try {
        if (!mountedRef.current) return null
        
        setProfileLoading(true)
        setProfileError(null)
        
        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Profile fetch timeout')), timeoutMs)
        })
        
        // Race between actual fetch and timeout
        const fetchPromise = supabase
          .from('users')
          .select('*')
          .eq('supa_id', userId)
          .single()
        
        const { data, error } = await Promise.race([fetchPromise, timeoutPromise])

        if (!mountedRef.current) return null

        if (error) {
          console.error('Error fetching user profile:', error)
          
          // If user doesn't exist in database, create a basic profile
          if (error.code === 'PGRST116') {
            const fallbackProfile = {
              id: null,
              supa_id: userId,
              first_name: '',
              last_name: '',
              created_at: new Date().toISOString(),
              settings: {}
            }
            
            if (mountedRef.current) {
              setProfileLoading(false)
              setUserProfile(fallbackProfile)
            }
            return fallbackProfile
          }
          
          // Retry logic for other errors
          if (retryCount < maxRetries) {
            console.log(`Retrying profile fetch (${retryCount + 1}/${maxRetries})`)
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))) // Exponential backoff
            return fetchUserProfile(userId, retryCount + 1)
          }
          
          // Set error state for failed fetches
          if (mountedRef.current) {
            setProfileError(error.message)
            setProfileLoading(false)
          }
          return null
        }

        if (mountedRef.current) {
          setProfileLoading(false)
          setUserProfile(data)
        }
        return data
      } catch (error) {
        console.error('Error in fetchUserProfile:', error)
        
        if (!mountedRef.current) return null
        
        // Handle timeout and network errors with retry
        if (retryCount < maxRetries && (error.message.includes('timeout') || error.name === 'NetworkError')) {
          console.log(`Retrying profile fetch after error (${retryCount + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
          return fetchUserProfile(userId, retryCount + 1)
        }
        
        if (mountedRef.current) {
          setProfileError(error.message)
          setProfileLoading(false)
        }
        return null
      } finally {
        if (profileFetchRef.current?.userId === userId) {
          profileFetchRef.current = null
        }
      }
    }
    
    // Store the promise to prevent duplicate fetches
    profileFetchRef.current = {
      userId,
      promise: fetchPromise()
    }
    
    return profileFetchRef.current.promise
  }, [supabase])
  
  // Create fallback profile from user metadata
  const createFallbackProfile = useCallback((user) => {
    return {
      id: null,
      supa_id: user.id,
      first_name: user.user_metadata?.first_name || '',
      last_name: user.user_metadata?.last_name || '',
      email: user.email,
      created_at: new Date().toISOString(),
      settings: {}
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mountedRef.current) return
        
        if (error) {
          console.error('Error getting session:', error)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
          
          // Fetch user profile if user exists, but don't block on it
          if (session?.user) {
            fetchUserProfile(session.user.id).catch(() => {
              // If profile fetch fails completely, set fallback
              if (mountedRef.current) {
                const fallback = createFallbackProfile(session.user)
                setUserProfile(fallback)
              }
            })
          }
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
      } finally {
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return
        
        console.log('Auth state changed:', event, session?.user?.email)
        
        setSession(session)
        setUser(session?.user ?? null)
        
        // Handle specific auth events first
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setSession(null)
          setUserProfile(null)
          setProfileError(null)
          setProfileLoading(false)
          
          // Cancel any ongoing profile fetches
          if (profileFetchRef.current) {
            profileFetchRef.current = null
          }
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current)
            retryTimeoutRef.current = null
          }
        } else if (session?.user && event === 'SIGNED_IN') {
          // For sign in, fetch profile but don't block
          fetchUserProfile(session.user.id).catch(() => {
            // If profile fetch fails completely, set fallback
            if (mountedRef.current) {
              const fallback = createFallbackProfile(session.user)
              setUserProfile(fallback)
            }
          })
        } else if (!session?.user) {
          setUserProfile(null)
          setProfileError(null)
          setProfileLoading(false)
        }
        
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    )

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
      
      // Cleanup ongoing operations
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [supabase.auth, fetchUserProfile, createFallbackProfile])

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
        throw error
      }
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithProvider = async (provider, options = {}) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          ...options
        }
      })

      if (error) {
        throw error
      }

      return { data, error: null }
    } catch (error) {
      console.error(`${provider} sign in error:`, error)
      setLoading(false)
      return { data: null, error }
    }
  }

  const value = useMemo(() => ({
    user,
    userProfile,
    session,
    loading,
    profileLoading,
    profileError,
    signOut,
    signInWithProvider,
    supabase,
    fetchUserProfile,
    retryProfileFetch: user ? () => fetchUserProfile(user.id) : null
  }), [user, userProfile, session, loading, profileLoading, profileError, signOut, signInWithProvider, supabase, fetchUserProfile])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}