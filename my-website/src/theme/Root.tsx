import React from 'react'
import { AuthProvider } from '../components/auth/AuthProvider'
import RagChatbot from '../components/RagChatbot/RagChatbot'

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <RagChatbot />
    </AuthProvider>
  )
}
