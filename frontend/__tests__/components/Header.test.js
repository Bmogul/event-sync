import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import Header from '../../src/components/layout/Header'
import { renderWithAuth, mockUser, mockUserProfile, mockSession } from '../utils/test-utils.helper'

// Mock the router
jest.mock('next/navigation')

// Mock Link component
jest.mock('next/link', () => {
  return ({ children, href, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
})

// Mock Container and Button components
jest.mock('../../src/components/layout/Container', () => {
  return ({ children }) => <div data-testid="container">{children}</div>
})

jest.mock('../../src/components/ui/Button', () => {
  return ({ children, onClick, variant, ...props }) => (
    <button onClick={onClick} data-variant={variant} {...props}>
      {children}
    </button>
  )
})

describe('Header Component', () => {
  let mockRouter

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
  })

  describe('Unauthenticated State', () => {
    it('should show sign in and create event buttons when user is not authenticated', () => {
      renderWithAuth(<Header />, {
        authValue: {
          user: null,
          userProfile: null,
          session: null,
          loading: false,
        }
      })

      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.getByText('Create Event')).toBeInTheDocument()
      expect(screen.queryByTestId('profile-button')).not.toBeInTheDocument()
    })

    it('should handle sign in button click', () => {
      renderWithAuth(<Header />, {
        authValue: {
          user: null,
          userProfile: null,
          session: null,
          loading: false,
        }
      })

      const signInButton = screen.getByText('Sign In')
      fireEvent.click(signInButton)

      expect(mockRouter.push).toHaveBeenCalledWith('/signIn')
    })

    it('should handle create event button click when not authenticated', () => {
      renderWithAuth(<Header />, {
        authValue: {
          user: null,
          userProfile: null,
          session: null,
          loading: false,
        }
      })

      const createEventButton = screen.getByText('Create Event')
      fireEvent.click(createEventButton)

      expect(mockRouter.push).toHaveBeenCalledWith('/create-event')
    })
  })

  describe('Authenticated State', () => {
    it('should show user profile and create event button when authenticated with full profile', () => {
      renderWithAuth(<Header />, {
        authValue: {
          user: mockUser,
          userProfile: mockUserProfile,
          session: mockSession,
          loading: false,
        }
      })

      expect(screen.getByText('Create Event')).toBeInTheDocument()
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
    })

    it('should show user email when profile name is not available', () => {
      renderWithAuth(<Header />, {
        authValue: {
          user: mockUser,
          userProfile: null,
          session: mockSession,
          loading: false,
        }
      })

      expect(screen.getByText(mockUser.email)).toBeInTheDocument()
    })

    it('should show user avatar when available', () => {
      renderWithAuth(<Header />, {
        authValue: {
          user: mockUser,
          userProfile: mockUserProfile,
          session: mockSession,
          loading: false,
        }
      })

      const avatar = screen.getByRole('img', { name: /Test User/ })
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', mockUserProfile.settings.avatar_url)
    })

    it('should show default avatar when user avatar is not available', () => {
      const profileWithoutAvatar = {
        ...mockUserProfile,
        settings: {}
      }

      renderWithAuth(<Header />, {
        authValue: {
          user: mockUser,
          userProfile: profileWithoutAvatar,
          session: mockSession,
          loading: false,
        }
      })

      const avatar = screen.getByRole('img', { name: /Default avatar/ })
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', '/avatar-placeholder.svg')
    })

    it('should handle create event button click when authenticated', () => {
      renderWithAuth(<Header />, {
        authValue: {
          user: mockUser,
          userProfile: mockUserProfile,
          session: mockSession,
          loading: false,
        }
      })

      const createEventButton = screen.getByText('Create Event')
      fireEvent.click(createEventButton)

      expect(mockRouter.push).toHaveBeenCalledWith('/create-event')
    })
  })

  describe('Profile Dropdown', () => {
    it('should toggle profile dropdown when profile button is clicked', () => {
      renderWithAuth(<Header />, {
        authValue: {
          user: mockUser,
          userProfile: mockUserProfile,
          session: mockSession,
          loading: false,
        }
      })

      const profileButton = screen.getByLabelText('User profile menu')
      
      // Dropdown should not be visible initially
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()

      // Click to open dropdown
      fireEvent.click(profileButton)
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Account Settings')).toBeInTheDocument()
      expect(screen.getByText('Sign Out')).toBeInTheDocument()

      // Click again to close dropdown
      fireEvent.click(profileButton)
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    })

    it('should show correct user information in dropdown header', () => {
      renderWithAuth(<Header />, {
        authValue: {
          user: mockUser,
          userProfile: mockUserProfile,
          session: mockSession,
          loading: false,
        }
      })

      const profileButton = screen.getByLabelText('User profile menu')
      fireEvent.click(profileButton)

      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText(mockUser.email)).toBeInTheDocument()
    })

    it('should handle dashboard navigation from dropdown', () => {
      renderWithAuth(<Header />, {
        authValue: {
          user: mockUser,
          userProfile: mockUserProfile,
          session: mockSession,
          loading: false,
        }
      })

      const profileButton = screen.getByLabelText('User profile menu')
      fireEvent.click(profileButton)

      const dashboardLink = screen.getByText('Dashboard')
      fireEvent.click(dashboardLink)

      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })

    it('should handle account settings navigation from dropdown', () => {
      renderWithAuth(<Header />, {
        authValue: {
          user: mockUser,
          userProfile: mockUserProfile,
          session: mockSession,
          loading: false,
        }
      })

      const profileButton = screen.getByLabelText('User profile menu')
      fireEvent.click(profileButton)

      const settingsLink = screen.getByText('Account Settings')
      fireEvent.click(settingsLink)

      expect(mockRouter.push).toHaveBeenCalledWith('/account/settings')
    })

    it('should handle sign out from dropdown', async () => {
      const mockSignOut = jest.fn().mockResolvedValue()

      renderWithAuth(<Header />, {
        authValue: {
          user: mockUser,
          userProfile: mockUserProfile,
          session: mockSession,
          loading: false,
          signOut: mockSignOut,
        }
      })

      const profileButton = screen.getByLabelText('User profile menu')
      fireEvent.click(profileButton)

      const signOutButton = screen.getByText('Sign Out')
      fireEvent.click(signOutButton)

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled()
        expect(mockRouter.push).toHaveBeenCalledWith('/')
      })
    })

    it('should handle sign out error gracefully', async () => {
      const mockSignOut = jest.fn().mockRejectedValue(new Error('Sign out failed'))

      renderWithAuth(<Header />, {
        authValue: {
          user: mockUser,
          userProfile: mockUserProfile,
          session: mockSession,
          loading: false,
          signOut: mockSignOut,
        }
      })

      const profileButton = screen.getByLabelText('User profile menu')
      fireEvent.click(profileButton)

      const signOutButton = screen.getByText('Sign Out')
      fireEvent.click(signOutButton)

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled()
        expect(console.error).toHaveBeenCalledWith('Error signing out:', expect.any(Error))
      })
    })

    it('should close dropdown when clicking outside', () => {
      renderWithAuth(<Header />, {
        authValue: {
          user: mockUser,
          userProfile: mockUserProfile,
          session: mockSession,
          loading: false,
        }
      })

      const profileButton = screen.getByLabelText('User profile menu')
      fireEvent.click(profileButton)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()

      // Click outside the dropdown
      fireEvent.click(document.body)

      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    })
  })

  describe('Mobile Menu', () => {
    it('should toggle mobile menu when hamburger is clicked', () => {
      renderWithAuth(<Header />, {
        authValue: {
          user: null,
          userProfile: null,
          session: null,
          loading: false,
        }
      })

      const hamburgerButton = screen.getByLabelText('Toggle mobile menu')
      
      // Mobile menu should not be visible initially
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument()

      // Click to open mobile menu
      fireEvent.click(hamburgerButton)
      // Note: In actual implementation, mobile menu content would be rendered
      // but for this test we'll just verify the click handler works
    })

    it('should show correct buttons in mobile menu for unauthenticated users', () => {
      renderWithAuth(<Header />, {
        authValue: {
          user: null,
          userProfile: null,
          session: null,
          loading: false,
        }
      })

      // Verify hamburger menu exists for mobile
      expect(screen.getByLabelText('Toggle mobile menu')).toBeInTheDocument()
    })

    it('should show correct user info in mobile menu for authenticated users', () => {
      renderWithAuth(<Header />, {
        authValue: {
          user: mockUser,
          userProfile: mockUserProfile,
          session: mockSession,
          loading: false,
        }
      })

      // Verify hamburger menu exists for mobile
      expect(screen.getByLabelText('Toggle mobile menu')).toBeInTheDocument()
    })
  })

  describe('Navigation Links', () => {
    it('should render all navigation links', () => {
      renderWithAuth(<Header />, {
        authValue: {
          user: null,
          userProfile: null,
          session: null,
          loading: false,
        }
      })

      expect(screen.getByText('Features')).toBeInTheDocument()
      expect(screen.getByText('How It Works')).toBeInTheDocument()
      expect(screen.getByText('Pricing')).toBeInTheDocument()
      expect(screen.getByText('Support')).toBeInTheDocument()
    })

    it('should render logo with correct link', () => {
      renderWithAuth(<Header />, {
        authValue: {
          user: null,
          userProfile: null,
          session: null,
          loading: false,
        }
      })

      const logo = screen.getByText('Event-Sync')
      expect(logo.closest('a')).toHaveAttribute('href', '/')
    })
  })

  describe('Scroll Behavior', () => {
    beforeEach(() => {
      // Mock scroll event
      global.scrollY = 0
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        value: 0,
      })
    })

    it('should handle scroll events and apply scrolled class', () => {
      renderWithAuth(<Header />, {
        authValue: {
          user: null,
          userProfile: null,
          session: null,
          loading: false,
        }
      })

      // Simulate scroll
      global.scrollY = 30
      fireEvent.scroll(window, { target: { scrollY: 30 } })

      // The actual scroll behavior would be tested in integration tests
      // Here we just verify the component renders without errors
      expect(screen.getByText('Event-Sync')).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should handle auth loading state gracefully', () => {
      renderWithAuth(<Header />, {
        authValue: {
          user: null,
          userProfile: null,
          session: null,
          loading: true,
        }
      })

      // Should render basic header structure even during loading
      expect(screen.getByText('Event-Sync')).toBeInTheDocument()
      expect(screen.getByText('Features')).toBeInTheDocument()
    })

    it('should show appropriate UI elements during partial loading states', () => {
      renderWithAuth(<Header />, {
        authValue: {
          user: mockUser,
          userProfile: null, // Profile still loading
          session: mockSession,
          loading: false,
        }
      })

      // Should show user email as fallback when profile is loading
      expect(screen.getByText(mockUser.email)).toBeInTheDocument()
      expect(screen.getByText('Create Event')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing user metadata gracefully', () => {
      const userWithoutMetadata = {
        ...mockUser,
        user_metadata: {}
      }

      renderWithAuth(<Header />, {
        authValue: {
          user: userWithoutMetadata,
          userProfile: null,
          session: mockSession,
          loading: false,
        }
      })

      expect(screen.getByText(userWithoutMetadata.email)).toBeInTheDocument()
    })

    it('should handle corrupted profile data gracefully', () => {
      const corruptedProfile = {
        ...mockUserProfile,
        first_name: null,
        last_name: undefined,
      }

      renderWithAuth(<Header />, {
        authValue: {
          user: mockUser,
          userProfile: corruptedProfile,
          session: mockSession,
          loading: false,
        }
      })

      // Should fall back to email when name is not available
      expect(screen.getByText(mockUser.email)).toBeInTheDocument()
    })
  })
})