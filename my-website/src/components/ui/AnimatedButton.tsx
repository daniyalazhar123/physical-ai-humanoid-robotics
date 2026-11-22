import React from 'react'

interface AnimatedButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  style?: React.CSSProperties
}

const variants = {
  primary: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
  },
  secondary: {
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--ifm-font-color-base)',
    border: '1px solid rgba(255,255,255,0.12)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--ifm-font-color-base)',
    border: 'none',
  },
}

const sizes = {
  sm: { padding: '0.3rem 0.7rem', fontSize: '0.8rem' },
  md: { padding: '0.5rem 1rem', fontSize: '0.9rem' },
  lg: { padding: '0.7rem 1.4rem', fontSize: '1rem' },
}

export default function AnimatedButton({ children, onClick, variant = 'primary', size = 'md', disabled, style }: AnimatedButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...variants[variant],
        ...sizes[size],
        borderRadius: 8,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s, opacity 0.2s',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'inherit',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(102,126,234,0.3)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {children}
    </button>
  )
}
