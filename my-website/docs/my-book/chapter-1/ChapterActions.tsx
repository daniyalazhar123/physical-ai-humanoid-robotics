import React, { useState, useRef, useEffect } from 'react'
import { FiTarget, FiGlobe, FiMessageSquare, FiEdit3, FiFileText } from 'react-icons/fi'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import { useAuth } from '@site/src/components/auth/AuthProvider'
import AuthModal from '@site/src/components/auth/AuthModal'
import { buildApiUrl, setApiBaseUrl } from '@site/src/lib/api'
import styles from './ChapterActions.module.css'

interface ChapterActionsProps {
  chapterTitle?: string
  chapterContent?: string
}

export default function ChapterActions({ chapterTitle, chapterContent }: ChapterActionsProps) {
  const { siteConfig } = useDocusaurusContext()
  const apiUrl = String((siteConfig.customFields as any)?.apiUrl || '')
  if (apiUrl) setApiBaseUrl(apiUrl)
  const { user, loading, signOut } = useAuth()
  const [personalised, setPersonalised] = useState(false)
  const [personalisedText, setPersonalisedText] = useState('')
  const [isPersonalising, setIsPersonalising] = useState(false)
  const [personaliseError, setPersonaliseError] = useState('')
  const [editText, setEditText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [translatedText, setTranslatedText] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [translateError, setTranslateError] = useState('')
  const [chatbotOpen, setChatbotOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const title = chapterTitle || 'this chapter'
  const preview = chapterContent ? chapterContent.slice(0, 300) : ''

  const fullChapter = personalisedText && !personalised ? personalisedText : chapterContent || preview

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const handleClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('button')
      if (!btn) return
      const id = btn.getAttribute('data-action')
      if (id === 'translate') {
        e.preventDefault()
        handleTranslate()
      } else if (id === 'chatbot') {
        e.preventDefault()
        setChatbotOpen(true)
      } else if (id === 'personalise') {
        e.preventDefault()
        handlePersonalise()
      }
    }
    el.addEventListener('click', handleClick as EventListener, true)
    return () => el.removeEventListener('click', handleClick as EventListener, true)
  }, [user, translatedText, fullChapter, preview, title])

  const handlePersonalise = async () => {
    if (personalised) {
      setPersonalised(false)
      setPersonalisedText('')
      return
    }
    if (!user) {
      setAuthOpen(true)
      return
    }
    setIsPersonalising(true)
    setPersonaliseError('')
    try {
      const response = await fetch('/api/v1/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'personalise',
          text: fullChapter,
          chapterTitle: title,
          backgroundSoftware: user.background_software || '',
          backgroundHardware: user.background_hardware || '',
          goal: user.goal || '',
        }),
      })
      const data = await response.json()
      if (!response.ok || data.error) {
        setPersonaliseError(data.error || 'Personalisation failed')
      } else {
        setPersonalisedText(data.editedText || '')
        setPersonalised(true)
      }
    } catch (err: any) {
      setPersonaliseError('Error: ' + (err?.message || 'unknown'))
    } finally {
      setIsPersonalising(false)
    }
  }

  const handleEdit = async () => {
    setIsEditing(true)
    setEditError('')
    try {
      const response = await fetch('/api/v1/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: editText.trim(), chapterTitle: title, text: editText.trim() }),
      })
      const data = await response.json()
      if (!response.ok || data.error) {
        setEditError(data.error || 'Edit failed')
      } else {
        setPersonalisedText(data.editedText || '')
        setPersonalised(true)
        setEditOpen(false)
      }
    } catch (err: any) {
      setEditError('Error: ' + (err?.message || 'unknown'))
    } finally {
      setIsEditing(false)
    }
  }

  const handleTranslate = async () => {
    if (translatedText) {
      setTranslatedText('')
      return
    }
    if (!user) {
      setAuthOpen(true)
      return
    }
    setIsTranslating(true)
    setTranslateError('')
    try {
      const url = buildApiUrl('/api/translate')
      console.log('[translate] POST', url)
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullChapter || preview || title, targetLang: 'ur' }),
      })
      console.log('[translate] response', response.status, url)
      const data = await response.json().catch(() => ({}))
      if (!response.ok || data.error || data.detail) {
        setTranslateError('Translation failed, try again')
      } else if (!data.translatedText) {
        setTranslateError('Translation failed, try again')
      } else {
        setTranslatedText(data.translatedText)
      }
    } catch (err: any) {
      console.error('[translate] failed', err)
      setTranslateError('Translation failed, try again')
    } finally {
      setIsTranslating(false)
    }
  }

  const ACTIONS = [
    { id: 'personalize', label: personalised ? 'Show Original' : 'Personalise', icon: <FiTarget /> },
    { id: 'translate', label: translatedText ? 'Show Original' : 'Translate to Urdu', icon: <FiGlobe /> },
    { id: 'chatbot', label: 'Ask Chatbot', icon: <FiMessageSquare /> },
    { id: 'edit', label: 'Ask AI / Edit', icon: <FiEdit3 /> },
    { id: 'summarize', label: 'Summarize', icon: <FiFileText /> },
  ]

  return (
    <div className={styles.container}>
      {ACTIONS.map((a) => (
        <button
          key={a.id}
          data-action={a.id}
          className={styles.actionBtn}
          onClick={() => {
            if (a.id === 'personalize') handlePersonalise()
            else if (a.id === 'translate') handleTranslate()
            else if (a.id === 'chatbot') setChatbotOpen(true)
            else if (a.id === 'edit') setEditOpen(true)
            else if (a.id === 'summarize') {
              const chatbot = document.querySelector('[aria-label="Toggle chatbot"]') as HTMLButtonElement
              if (chatbot) chatbot.click()
            }
          }}
        >
          {a.icon}
          {a.label}
        </button>
      ))}

      {personaliseError && <p className={styles.error}>{personaliseError}</p>}
      {personalised && personalisedText && (
        <div ref={contentRef} className={styles.personalisedBox}>
          <strong>Personalised Content:</strong>
          <div className={styles.personalisedText}>{personalisedText}</div>
        </div>
      )}

      {translateError && <p className={styles.error}>{translateError}</p>}
      {translatedText && (
        <div className={styles.urduBox} style={{ direction: 'rtl', fontFamily: '"Noto Nastaliq Urdu", serif' }}>
          {translatedText}
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && (
        <div className={styles.editModal}>
          <div className={styles.editBox}>
            <h4>Ask AI / Edit</h4>
            <p style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '0.5rem' }}>Ask a question or request an edit. E.g., "Make this simpler" or "Add a code example".</p>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="Ask a question about this chapter..."
              rows={3}
              className={styles.editInput}
            />
            {editError && <p className={styles.error}>{editError}</p>}
            <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem' }}>
              <button className={styles.editBtn} onClick={() => setEditOpen(false)} disabled={isEditing}>
                Cancel
              </button>
              <button className={styles.editBtn} onClick={handleEdit} disabled={isEditing || !editText.trim()}>
                {isEditing ? 'Processing...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  )
}
