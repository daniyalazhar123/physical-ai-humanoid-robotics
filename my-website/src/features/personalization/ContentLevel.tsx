import React from 'react'
import { useAuth } from '../auth'

interface ContentLevelProps {
  beginner: React.ReactNode
  intermediate?: React.ReactNode
  advanced?: React.ReactNode
  fallback?: React.ReactNode
}

export default function ContentLevel({ beginner, intermediate, advanced, fallback }: ContentLevelProps) {
  const { user } = useAuth()
  const level = user?.skillLevel || 'Beginner'

  if (level === 'Advanced' && advanced) return <>{advanced}</>
  if (level === 'Intermediate' && intermediate) return <>{intermediate}</>
  if (level === 'Beginner') return <>{beginner}</>
  return <>{fallback || beginner}</>
}
