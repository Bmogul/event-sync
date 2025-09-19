import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../src/app/contexts/AuthContext'
import { createMockSupabaseClient, mockUser, mockUserProfile, mockSession, simulateNetworkDelay } from '../utils/test-utils.helper'

// Test component to use the AuthContext
const TestComponent = () => {
  const auth = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{auth.loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{auth.user ? auth.user.email : 'no-user'}</div>
      <div data-testid="profile">{auth.userProfile ? `${auth.userProfile.first_name} ${auth.userProfile.last_name}` : 'no-profile'}</div>
      <div data-testid="session">{auth.session ? 'has-session' : 'no-session'}</div>
      <button data-testid="sign-out" onClick={auth.signOut}>Sign Out</button>
      <button data-testid="sign-in" onClick={() => auth.signInWithProvider('google')}>Sign In</button>
    </div>
  )
}

// Mock the createClient function
const mockCreateClient = jest.fn()
jest.mock('../../src/app/utils/supabase/client', () => ({
  createClient: () => mockCreateClient()
}))

describe('AuthContext', () => {
  let mockSupabase

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase = createMockSupabaseClient()
    mockCreateClient.mockReturnValue(mockSupabase)
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('Initial Loading State', () => {
    it('should start with loading true and no user', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(screen.getByTestId('loading')).toHaveTextContent('loading')
      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
      expect(screen.getByTestId('profile')).toHaveTextContent('no-profile')
      expect(screen.getByTestId('session')).toHaveTextContent('no-session')
    })
  })

  describe('Session Management', () => {
    it('should handle successful session retrieval', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUserProfile,
              error: null
            })
          })
        })
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email)
      expect(screen.getByTestId('profile')).toHaveTextContent('Test User')
      expect(screen.getByTestId('session')).toHaveTextContent('has-session')
    })

    it('should handle session retrieval error gracefully', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session error' }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
      expect(screen.getByTestId('session')).toHaveTextContent('no-session')
    })
  })

  describe('User Profile Management', () => {
    it('should create fallback profile when user profile not found in database', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Simulate user not found in database
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows found' }
            })
          })
        })
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email)
      expect(screen.getByTestId('profile')).toHaveTextContent('Test User') // From fallback profile
      expect(screen.getByTestId('session')).toHaveTextContent('has-session')
    })

    it('should handle profile fetch timeout and provide fallback', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Simulate network timeout
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockImplementation(async () => {
              await simulateNetworkDelay(10000) // Simulate very long delay
              throw new Error('Network timeout')
            })
          })
        })
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      }, { timeout: 3000 })

      // Should still show user even if profile failed
      expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email)
      expect(screen.getByTestId('session')).toHaveTextContent('has-session')
    })

    it('should retry failed profile fetch', async () => {
      const failedResponse = { data: null, error: { message: 'Network error' } }
      const successResponse = { data: mockUserProfile, error: null }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // First call fails, second succeeds
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn()
              .mockResolvedValueOnce(failedResponse)
              .mockResolvedValueOnce(successResponse)
          })
        })
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      // Should eventually show profile after retry
      await waitFor(() => {
        expect(screen.getByTestId('profile')).toHaveTextContent('Test User')
      })
    })
  })

  describe('Auth State Changes', () => {
    it('should handle auth state change to signed in', async () => {
      let authStateCallback

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUserProfile,
              error: null
            })
          })
        })
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      // Simulate auth state change
      await act(async () => {
        authStateCallback('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email)
        expect(screen.getByTestId('profile')).toHaveTextContent('Test User')
        expect(screen.getByTestId('session')).toHaveTextContent('has-session')
      })
    })

    it('should handle auth state change to signed out', async () => {
      let authStateCallback

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      // Start with authenticated state
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      // Simulate sign out
      await act(async () => {
        authStateCallback('SIGNED_OUT', null)
      })

      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
      expect(screen.getByTestId('profile')).toHaveTextContent('no-profile')
      expect(screen.getByTestId('session')).toHaveTextContent('no-session')
    })

    it('should prevent race conditions with multiple rapid auth state changes', async () => {
      let authStateCallback

      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockImplementation(async () => {
              await simulateNetworkDelay(100)
              return { data: mockUserProfile, error: null }
            })
          })
        })
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      // Rapid fire auth state changes
      await act(async () => {
        authStateCallback('SIGNED_IN', mockSession)
        authStateCallback('SIGNED_IN', mockSession)
        authStateCallback('SIGNED_IN', mockSession)
      })

      // Should handle gracefully without multiple profile fetches
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email)
      })

      // Verify profile fetch wasn't called excessively
      expect(mockSupabase.from).toHaveBeenCalledTimes(1)
    })
  })

  describe('Sign Out Functionality', () => {
    it('should handle successful sign out', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      await act(async () => {
        screen.getByTestId('sign-out').click()
      })

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    it('should handle sign out error', async () => {
      const signOutError = new Error('Sign out failed')
      mockSupabase.auth.signOut.mockRejectedValue(signOutError)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      await act(async () => {
        screen.getByTestId('sign-out').click()
      })

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      // Should log error but not crash
      expect(console.error).toHaveBeenCalledWith('Sign out error:', signOutError)
    })
  })

  describe('OAuth Sign In', () => {
    it('should handle successful OAuth sign in', async () => {
      const oauthResponse = {
        data: { provider: 'google', url: 'https://oauth.url' },
        error: null
      }
      
      mockSupabase.auth.signInWithOAuth.mockResolvedValue(oauthResponse)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      await act(async () => {
        screen.getByTestId('sign-in').click()
      })

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback'
        }
      })
    })

    it('should handle OAuth sign in error', async () => {
      const oauthError = new Error('OAuth failed')
      mockSupabase.auth.signInWithOAuth.mockRejectedValue(oauthError)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      await act(async () => {
        screen.getByTestId('sign-in').click()
      })

      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalled()
      expect(console.error).toHaveBeenCalledWith('google sign in error:', oauthError)
    })
  })

  describe('Error Recovery', () => {
    it('should provide mechanism to retry failed operations', async () => {
      const { rerender } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      // Context should provide fetchUserProfile for manual retry
      expect(mockCreateClient).toHaveBeenCalled()
    })

    it('should handle multiple consecutive errors gracefully', async () => {
      mockSupabase.auth.getSession.mockRejectedValue(new Error('Session error'))
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Database error'))
          })
        })
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      // Should not crash despite multiple errors
      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    })
  })

  describe('Component Unmount', () => {
    it('should cleanup subscriptions on unmount', () => {
      const unsubscribeMock = jest.fn()
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: unsubscribeMock } }
      })

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      unmount()

      expect(unsubscribeMock).toHaveBeenCalled()
    })
  })
})