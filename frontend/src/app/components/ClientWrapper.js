'use client'

import { AuthProvider } from '../contexts/AuthContext'

export default function ClientWrapper({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}