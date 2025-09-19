import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import Dashboard from '../../src/app/dashboard/page'
import { renderWithAuth, mockUser, mockUserProfile, mockSession, createMockSupabaseClient } from '../utils/test-utils.helper'

// Mock the router
jest.mock('next/navigation')

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

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            then: jest.fn().mockResolvedValue({
              data: [{ event_id: 1 }],
              error: null
            })
          }),
          in: jest.fn().mockResolvedValue({
            data: mockEvents,
            error: null
          })
        })
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
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockRejectedValue(new Error('Database error'))
        })
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
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
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

      const createButton = screen.getByText('➕ Create Event')
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

      const signOutButton = screen.getByText('🚪 Sign Out')
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

      const signOutButton = screen.getByText('🚪 Sign Out')
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
      // First call fails
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockRejectedValue(new Error('Network error'))
          })
        })
        // Second call succeeds
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
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

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(pendingPromise)
        })
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

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Loading events...')).toBeInTheDocument()
      })

      // Re-render with same props
      rerender(
        renderWithAuth(<Dashboard />, {
          authValue: {
            user: mockUser,
            userProfile: mockUserProfile,
            session: mockSession,
            loading: false,
            supabase: mockSupabase,
          }
        }).container.firstChild
      )

      // Should not have made additional API calls
      expect(mockSupabase.from).toHaveBeenCalledTimes(1)

      // Resolve the promise
      resolvePromise({ data: [], error: null })

      await waitFor(() => {
        expect(screen.getByText('No events yet')).toBeInTheDocument()
      })
    })
  })
})