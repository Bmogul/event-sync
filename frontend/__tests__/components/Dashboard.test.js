import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import Dashboard from '../../src/app/dashboard/page'
import { renderWithAuth, mockUser, mockUserProfile, mockSession, createMockSupabaseClient } from '../utils/test-utils.helper'

// Mock the router
jest.mock('next/navigation')

// Mock supabase client so AuthProvider doesn't fail when testValue is provided
jest.mock('../../src/app/utils/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
      signInWithOAuth: jest.fn().mockResolvedValue({ data: null, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
    }),
    removeChannel: jest.fn().mockResolvedValue({}),
  })),
  supabase: {},
}))

// Mock toast
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}))

describe('Dashboard Component', () => {
  let mockRouter
  let mockSupabase

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockRouter = {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
    
    useRouter.mockReturnValue(mockRouter)
    
    mockSupabase = createMockSupabaseClient()
  })

  describe('Authentication Requirements', () => {
    it('should redirect to sign in when user is not authenticated', async () => {
      renderWithAuth(<Dashboard />, {
        authValue: {
          user: null,
          userProfile: null,
          session: null,
          loading: false,
          supabase: mockSupabase,
        }
      })

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/signIn')
      })
    })

    it('should show loading state while authentication is being checked', () => {
      renderWithAuth(<Dashboard />, {
        authValue: {
          user: null,
          userProfile: null,
          session: null,
          loading: true,
          supabase: mockSupabase,
        }
      })

      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument()
    })

    it('should render dashboard when user is authenticated but profile is loading', async () => {
      renderWithAuth(<Dashboard />, {
        authValue: {
          user: mockUser,
          userProfile: null,
          session: mockSession,
          loading: false,
          supabase: mockSupabase,
        }
      })

      await waitFor(() => {
        expect(screen.getByText('Welcome back, User!')).toBeInTheDocument()
      })

      // Should not redirect
      expect(mockRouter.push).not.toHaveBeenCalledWith('/signIn')
    })

    it('should render dashboard when both user and profile are available', async () => {
      renderWithAuth(<Dashboard />, {
        authValue: {
          user: mockUser,
          userProfile: mockUserProfile,
          session: mockSession,
          loading: false,
          supabase: mockSupabase,
        }
      })

      await waitFor(() => {
        expect(screen.getByText('Welcome back, Test User!')).toBeInTheDocument()
      })
    })
  })

  describe('Data Fetching', () => {
    it('should fetch events when user and profile are available', async () => {
      const mockEvents = [
        {
          public_id: 'event-1',
          title: 'Test Event',
          start_date: '2024-01-01',
          status: { state: 'active' },
          capacity: 100,
          total_yes: 50,
        }
      ]

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'event_manage_roles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null })
              })
            })
          }
        }
        if (table === 'events') {
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockResolvedValue({ data: mockEvents, error: null })
            })
          }
        }
        // event_managers: return one owned event_id
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [{ event_id: 1 }], error: null }),
              neq: jest.fn().mockResolvedValue({ data: [], error: null }),
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
            in: jest.fn().mockResolvedValue({ data: [], error: null }),
          })
        }
      })

      renderWithAuth(<Dashboard />, {
        authValue: {
          user: mockUser,
          userProfile: mockUserProfile,
          session: mockSession,
          loading: false,
          supabase: mockSupabase,
        }
      })

      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument()
      })
    })

    it('should handle events fetch error gracefully', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'event_manage_roles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
              })
            })
          }
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
              neq: jest.fn().mockResolvedValue({ data: [], error: null }),
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
            in: jest.fn().mockResolvedValue({ data: [], error: null }),
          })
        }
      })

      renderWithAuth(<Dashboard />, {
        authValue: {
          user: mockUser,
          userProfile: mockUserProfile,
          session: mockSession,
          loading: false,
          supabase: mockSupabase,
        }
      })

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load events')
      })

      expect(screen.getByText('Failed to load events')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    it('should show empty state when no events exist', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'event_manage_roles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null })
              })
            })
          }
        }
        // event_managers and others: return empty arrays
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
              neq: jest.fn().mockResolvedValue({ data: [], error: null }),
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
            in: jest.fn().mockResolvedValue({ data: [], error: null }),
          })
        }
      })

      renderWithAuth(<Dashboard />, {
        authValue: {
          user: mockUser,
          userProfile: mockUserProfile,
          session: mockSession,
          loading: false,
          supabase: mockSupabase,
        }
      })

      await waitFor(() => {
        expect(screen.getByText('No events yet')).toBeInTheDocument()
        expect(screen.getByText('Create your first event to get started!')).toBeInTheDocument()
      })
    })

    it('should skip data fetching when userProfile has no database ID', async () => {
      const profileWithoutId = { ...mockUserProfile, id: null }

      renderWithAuth(<Dashboard />, {
        authValue: {
          user: mockUser,
          userProfile: profileWithoutId,
          session: mockSession,
          loading: false,
          supabase: mockSupabase,
        }
      })

      await waitFor(() => {
        expect(screen.getByText('No events yet')).toBeInTheDocument()
      })

      // Should not have called the database
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })
  })

  describe('User Interface Functionality', () => {
    it('should handle create event navigation', async () => {
      renderWithAuth(<Dashboard />, {
        authValue: {
          user: mockUser,
          userProfile: mockUserProfile,
          session: mockSession,
          loading: false,
          supabase: mockSupabase,
        }
      })

      const createButton = screen.getByRole('button', { name: /Create Event/i })
      fireEvent.click(createButton)

      expect(mockRouter.push).toHaveBeenCalledWith('/create-event')
    })

    it('should handle sign out functionality', async () => {
      const mockSignOut = jest.fn().mockResolvedValue()

      renderWithAuth(<Dashboard />, {
        authValue: {
          user: mockUser,
          userProfile: mockUserProfile,
          session: mockSession,
          loading: false,
          supabase: mockSupabase,
          signOut: mockSignOut,
        }
      })

      const signOutButton = screen.getByRole('button', { name: /Sign Out/i })
      fireEvent.click(signOutButton)

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled()
        expect(toast.success).toHaveBeenCalledWith('Successfully signed out')
        expect(mockRouter.push).toHaveBeenCalledWith('/')
      })
    })

    it('should handle sign out error', async () => {
      const mockSignOut = jest.fn().mockRejectedValue(new Error('Sign out failed'))

      renderWithAuth(<Dashboard />, {
        authValue: {
          user: mockUser,
          userProfile: mockUserProfile,
          session: mockSession,
          loading: false,
          supabase: mockSupabase,
          signOut: mockSignOut,
        }
      })

      const signOutButton = screen.getByRole('button', { name: /Sign Out/i })
      fireEvent.click(signOutButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to sign out')
      })
    })

    it('should display correct user information in header', async () => {
      renderWithAuth(<Dashboard />, {
        authValue: {
          user: mockUser,
          userProfile: mockUserProfile,
          session: mockSession,
          loading: false,
          supabase: mockSupabase,
        }
      })

      await waitFor(() => {
        expect(screen.getByText('Welcome back, Test User!')).toBeInTheDocument()
        expect(screen.getByText(mockUser.email)).toBeInTheDocument()
      })
    })

    it('should handle missing profile data gracefully', async () => {
      renderWithAuth(<Dashboard />, {
        authValue: {
          user: mockUser,
          userProfile: null,
          session: mockSession,
          loading: false,
          supabase: mockSupabase,
        }
      })

      await waitFor(() => {
        expect(screen.getByText('Welcome back, User!')).toBeInTheDocument()
        expect(screen.getByText(mockUser.email)).toBeInTheDocument()
      })
    })
  })

  describe('Retry Functionality', () => {
    it('should allow retrying failed data fetches', async () => {
      // Use a shared single mock so we can control call order
      const mockSingleFn = jest.fn()
        .mockResolvedValueOnce({ data: null, error: { message: 'Network error' } }) // fetchEvents initial: owner role fails
        .mockResolvedValueOnce({ data: { id: 1 }, error: null }) // fetchCollaborations initial: owner role succeeds
        .mockResolvedValue({ data: { id: 1 }, error: null }) // all subsequent (retry): owner role succeeds

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'event_manage_roles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({ single: mockSingleFn })
            })
          }
        }
        if (table === 'event_managers') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: [], error: null }),
                neq: jest.fn().mockResolvedValue({ data: [], error: null }),
              })
            })
          }
        }
        // Default: return empty resolved values for any other table
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
              in: jest.fn().mockResolvedValue({ data: [], error: null }),
            })
          })
        }
      })

      renderWithAuth(<Dashboard />, {
        authValue: {
          user: mockUser,
          userProfile: mockUserProfile,
          session: mockSession,
          loading: false,
          supabase: mockSupabase,
        }
      })

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument()
      })

      const retryButton = screen.getByText('Try Again')
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('No events yet')).toBeInTheDocument()
      })
    })
  })

  describe('Tab Navigation', () => {
    it('should switch between events and collaborations tabs', async () => {
      renderWithAuth(<Dashboard />, {
        authValue: {
          user: mockUser,
          userProfile: mockUserProfile,
          session: mockSession,
          loading: false,
          supabase: mockSupabase,
        }
      })

      // Default to events tab
      await waitFor(() => {
        expect(screen.getByText('My Events (0)')).toBeInTheDocument()
      })

      // Switch to collaborations tab
      const collaborationsTab = screen.getByText(/Collaborations/)
      fireEvent.click(collaborationsTab)

      expect(screen.getByText('Events where you\'ve been invited as a collaborator')).toBeInTheDocument()
    })
  })

  describe('Performance Considerations', () => {
    it('should not refetch data when already loading', async () => {
      let resolvePromise
      const pendingPromise = new Promise(resolve => {
        resolvePromise = resolve
      })

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'event_manage_roles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                // single() returns the pending promise — keeps component in loading state
                single: jest.fn(() => pendingPromise)
              })
            })
          }
        }
        // event_managers and others: return empty results after pending resolves
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [], error: null }),
              neq: jest.fn().mockResolvedValue({ data: [], error: null }),
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
            in: jest.fn().mockResolvedValue({ data: [], error: null }),
          })
        }
      })

      const { rerender } = renderWithAuth(<Dashboard />, {
        authValue: {
          user: mockUser,
          userProfile: mockUserProfile,
          session: mockSession,
          loading: false,
          supabase: mockSupabase,
        }
      })

      // Should show loading state while promise is pending
      await waitFor(() => {
        expect(screen.getByText('Loading events...')).toBeInTheDocument()
      })

      // Capture call count before re-render
      const fromCallsBefore = mockSupabase.from.mock.calls.length

      // Re-render with same props — wrapper is preserved by RTL, useEffect deps unchanged
      rerender(<Dashboard />)

      // Should not have made additional API calls
      expect(mockSupabase.from).toHaveBeenCalledTimes(fromCallsBefore)

      // Resolve the pending promise with a valid owner role
      resolvePromise({ data: { id: 1 }, error: null })

      await waitFor(() => {
        expect(screen.getByText('No events yet')).toBeInTheDocument()
      })
    })
  })
})