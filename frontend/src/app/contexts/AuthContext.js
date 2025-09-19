'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '../utils/supabase/client'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const supabase = createClient()

  // Function to fetch user profile from database
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('supa_id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        
        // If user doesn't exist in database, create a basic profile
        if (error.code === 'PGRST116') {
          // Return a basic profile structure instead of null
          return {
            id: null,
            supa_id: userId,
            first_name: '',
            last_name: '',
            created_at: new Date().toISOString(),
            settings: {}
          }
        }
        return null
      }

      return data
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      return null
    }
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
          
          // Fetch user profile if user exists
          if (session?.user) {
            const profile = await fetchUserProfile(session.user.id)
            // Ensure we always have a userProfile object, even if it's basic
            setUserProfile(profile || {
              id: null,
              supa_id: session.user.id,
              first_name: session.user.user_metadata?.first_name || '',
              last_name: session.user.user_metadata?.last_name || '',
              email: session.user.email,
              created_at: new Date().toISOString(),
              settings: {}
            })
          }
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        setSession(session)
        setUser(session?.user ?? null)
        
        // Fetch user profile if user exists
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id)
          // Ensure we always have a userProfile object, even if it's basic
          setUserProfile(profile || {
            id: null,
            supa_id: session.user.id,
            first_name: session.user.user_metadata?.first_name || '',
            last_name: session.user.user_metadata?.last_name || '',
            email: session.user.email,
            created_at: new Date().toISOString(),
            settings: {}
          })
        } else {
          setUserProfile(null)
        }
        
        setLoading(false)

        // Handle specific auth events
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setSession(null)
          setUserProfile(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

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

  const value = {
    user,
    userProfile,
    session,
    loading,
    signOut,
    signInWithProvider,
    supabase,
    fetchUserProfile
  }

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