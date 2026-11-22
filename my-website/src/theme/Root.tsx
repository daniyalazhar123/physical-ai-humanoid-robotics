import React from 'react'
import { AuthProvider } from '../components/auth/AuthProvider'
import ProfileDropdown from '../components/auth/ProfileDropdown'
import RagChatbot from '../components/RagChatbot/RagChatbot'

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <RagChatbot />
      <div style={{ position: 'fixed', top: '0.5rem', right: '6rem', zIndex: 10000 }}>
        <ProfileDropdown />
      </div>
    </AuthProvider>
  )
}
