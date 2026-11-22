import React from 'react'
import { useAuth } from '../auth'

const levelColors: Record<string, string> = {
  Beginner: '#4caf50',
  Intermediate: '#ff9800',
  Advanced: '#f44336',
}

export default function LevelIndicator() {
  const { user } = useAuth()

  if (!user?.skillLevel) return null

  const color = levelColors[user.skillLevel] || '#888'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: '0.75rem',
        padding: '2px 8px',
        borderRadius: 4,
        background: `${color}20`,
        color,
        border: `1px solid ${color}40`,
        fontWeight: 500,
      }}
    >
      <span style={{ fontSize: '0.65rem' }}>●</span>
      {user.skillLevel}
    </span>
  )
}
