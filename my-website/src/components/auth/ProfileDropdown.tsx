import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import AuthModal from './AuthModal'

export default function ProfileDropdown() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!user) {
    return (
      <>
        <button onClick={() => setAuthOpen(true)} style={styles.authBtn}>
          Personalise
        </button>
        <button onClick={() => setAuthOpen(true)} style={styles.authBtn}>
          Sign In
        </button>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </>
    )
  }

  const initial = (user.name || user.email)[0].toUpperCase()

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={styles.avatar}>
        {initial}
      </button>
      {open && (
        <div style={styles.dropdown}>
          <div style={styles.header}>
            <strong>{user.name || 'User'}</strong>
            <span style={styles.email}>{user.email}</span>
            {user.role && <span style={styles.badge}>{user.role}</span>}
            {user.skillLevel && <span style={styles.badge}>{user.skillLevel}</span>}
          </div>
          <hr style={styles.divider} />
          <button onClick={() => { signOut(); setOpen(false) }} style={styles.signOut}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  authBtn: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '0.4rem 1rem',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.85rem',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.2)',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
  },
  dropdown: {
    position: 'absolute',
    right: 0,
    top: 'calc(100% + 8px)',
    background: 'rgba(30,30,50,0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '0.75rem',
    minWidth: 220,
    zIndex: 9999,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    color: '#fff',
  },
  email: {
    fontSize: '0.8rem',
    color: '#999',
  },
  badge: {
    fontSize: '0.75rem',
    background: 'rgba(102,126,234,0.2)',
    color: '#667eea',
    padding: '2px 8px',
    borderRadius: 4,
    display: 'inline-block',
    marginRight: 4,
  },
  divider: {
    border: 'none',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    margin: '0.5rem 0',
  },
  signOut: {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    color: '#ff6b6b',
    border: '1px solid rgba(255,107,107,0.3)',
    borderRadius: 8,
    padding: '0.5rem',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '0.85rem',
  },
}
