import React, { useState } from 'react'
import { useAuth } from './AuthProvider'

const ROLES = ['Student', 'Teacher', 'Developer', 'Researcher', 'Robotics Engineer'] as const
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const { signIn, signUp, refreshSession, user } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>(user ? 'signin' : 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<string>('Student')
  const [skillLevel, setSkillLevel] = useState<string>('Beginner')
  const [backgroundSoftware, setBackgroundSoftware] = useState('')
  const [backgroundHardware, setBackgroundHardware] = useState('')
  const [goal, setGoal] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password, name, role, skillLevel, {
          background_software: backgroundSoftware,
          background_hardware: backgroundHardware,
          goal,
        })
      }
      await refreshSession()
      onClose()
    } catch (err: any) {
      setError(err?.message || err?.error?.message || 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>✕</button>
        <h2 style={styles.title}>{mode === 'signin' ? 'Sign In' : 'Sign Up'}</h2>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div style={styles.field}>
              <label style={styles.label}>Name</label>
              <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} />
          </div>

          {mode === 'signup' && (
            <>
              <div style={styles.field}>
                <label style={styles.label}>Role</label>
                <select style={styles.input} value={role} onChange={(e) => setRole(e.target.value)}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Software Background</label>
                <select style={styles.input} value={backgroundSoftware} onChange={(e) => setBackgroundSoftware(e.target.value)}>
                  <option value="">— Select —</option>
                  <option value="Beginner">Beginner (No / Little experience)</option>
                  <option value="Python">Python</option>
                  <option value="Web">Web (HTML/CSS/JS)</option>
                  <option value="C++">C++ / ROS 2</option>
                  <option value="AI/ML">AI / ML Experience</option>
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Hardware Background</label>
                <select style={styles.input} value={backgroundHardware} onChange={(e) => setBackgroundHardware(e.target.value)}>
                  <option value="">— Select —</option>
                  <option value="None">No hardware experience</option>
                  <option value="Arduino">Arduino / Microcontrollers</option>
                  <option value="Jetson">NVIDIA Jetson / Computing platforms</option>
                  <option value="Robotics">Robotics / Boards</option>
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Goal</label>
                <select style={styles.input} value={goal} onChange={(e) => setGoal(e.target.value)}>
                  <option value="">— Select —</option>
                  <option value="Learning">Learning for general knowledge</option>
                  <option value="Career">Career transition into AI/Robotics</option>
                  <option value="Project">Personal project building</option>
                  <option value="Academic">Academic / University requirement</option>
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Skill Level</label>
                <select style={styles.input} value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)}>
                  {SKILL_LEVELS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </>
          )}

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.submit} type="submit" disabled={submitting}>
            {submitting ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={styles.toggle}>
          {mode === 'signin' ? (
            <>Don't have an account? <button style={styles.linkBtn} onClick={() => { setMode('signup'); setError('') }}>Sign Up</button></>
          ) : (
            <>Already have an account? <button style={styles.linkBtn} onClick={() => { setMode('signin'); setError('') }}>Sign In</button></>
          )}
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modal: {
    background: 'rgba(30,30,50,0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: '2rem',
    width: '90%',
    maxWidth: 420,
    color: '#fff',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 16,
    background: 'none',
    border: 'none',
    color: '#999',
    fontSize: 20,
    cursor: 'pointer',
  },
  title: {
    margin: '0 0 1.5rem',
    fontSize: '1.5rem',
    fontWeight: 600,
  },
  field: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '0.85rem',
    marginBottom: 4,
    color: '#bbb',
  },
  input: {
    width: '100%',
    padding: '0.65rem 0.75rem',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.06)',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  error: {
    color: '#ff6b6b',
    fontSize: '0.85rem',
    margin: '0.5rem 0',
  },
  submit: {
    width: '100%',
    padding: '0.7rem',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  toggle: {
    textAlign: 'center',
    marginTop: '1rem',
    fontSize: '0.85rem',
    color: '#999',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    cursor: 'pointer',
    fontSize: '0.85rem',
    textDecoration: 'underline',
  },
}
