import React from 'react'

interface GlassCardProps {
  children: React.ReactNode
  style?: React.CSSProperties
  className?: string
  hover?: boolean
}

export default function GlassCard({ children, style, className, hover = true }: GlassCardProps) {
  return (
    <div
      className={className}
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: '1.5rem',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: hover ? 'default' : undefined,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (hover) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.2)'
        }
      }}
      onMouseLeave={(e) => {
        if (hover) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      {children}
    </div>
  )
}
