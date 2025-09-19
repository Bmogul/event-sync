import React from 'react'
import { render } from '@testing-library/react'
import { AuthProvider } from '../../src/app/contexts/AuthContext'

// Mock Supabase client
export const createMockSupabaseClient = (overrides = {}) => {
  return {
    auth: {
      getSession: jest.fn().mockResolvedValue({ 
        data: { session: null }, 
        error: null 
      }),
      getUser: jest.fn().mockResolvedValue({ 
        data: { user: null }, 
        error: null 
      }),
      signInWithOAuth: jest.fn().mockResolvedValue({
        data: { provider: 'google', url: 'http://test.com' },
        error: null
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      }),
      exchangeCodeForSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null
      }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'No rows found' }
          })
        }),
        in: jest.fn().mockReturnValue({
          then: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      }),
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null })
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null })
      })
    }),
    ...overrides
  }
}

// Mock user data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    first_name: 'Test',
    last_name: 'User'
  }
}

export const mockUserProfile = {
  id: 1,
  supa_id: 'test-user-id',
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  settings: {
    avatar_url: '/test-avatar.jpg'
  }
}

export const mockSession = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  user: mockUser,
  expires_at: Date.now() + 3600000
}

// Custom render function that includes AuthProvider
export const renderWithAuth = (ui, { authValue = {}, ...renderOptions } = {}) => {
  const defaultAuthValue = {
    user: null,
    userProfile: null,
    session: null,
    loading: false,
    signOut: jest.fn(),
    signInWithProvider: jest.fn(),
    supabase: createMockSupabaseClient(),
    fetchUserProfile: jest.fn(),
    ...authValue
  }

  function Wrapper({ children }) {
    return (
      <AuthProvider value={defaultAuthValue}>
        {children}
      </AuthProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Helper to simulate network delays
export const simulateNetworkDelay = (ms = 100) => 
  new Promise(resolve => setTimeout(resolve, ms))

// Mock localStorage
export const mockLocalStorage = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString() },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

// Mock sessionStorage
export const mockSessionStorage = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString() },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

// Setup localStorage mock
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
})