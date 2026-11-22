import React from 'react'
import { AuthProvider } from '../components/auth/AuthProvider'
import ProfileDropdown from '../components/auth/ProfileDropdown'
import RagChatbot from '../components/RagChatbot/RagChatbot'

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <RagChatbot />
      <div className="auth-nav-fixed">
        <ProfileDropdown />
      </div>
    </AuthProvider>
  )
}
