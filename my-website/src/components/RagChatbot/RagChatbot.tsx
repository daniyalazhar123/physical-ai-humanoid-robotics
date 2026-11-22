import React, { useState, useRef, useEffect } from 'react'
import styles from './RagChatbot.module.css'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
}

const API_URL = process.env.NODE_ENV === 'production'
  ? '/api/v1/chat/chat'
  : 'http://localhost:8000/api/v1/chat/chat'

const API_TOKEN = 'physical-ai-secret-2025'

export default function RagChatbot() {
  const [open, setOpen] = useState(false)
  const [language, setLanguage] = useState<'en' | 'ur'>('en')
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello! I\'m your Physical AI tutor. Ask me anything about the textbook.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open])

  const handleSend = async () => {
    const query = input.trim()
    if (!query || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: query }])
    setLoading(true)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-token': API_TOKEN,
        },
        body: JSON.stringify({
          message: query,
          language,
          history: messages.slice(1).map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply || data.response || 'I don\'t know',
        sources: data.sources || [],
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }])
    } finally {
      setLoading(false)
    }
  }

  const toggleOpen = () => {
    setOpen(prev => !prev)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      <button
        className={styles.fab}
        onClick={toggleOpen}
        aria-label="Toggle chatbot"
        type="button"
      >
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <div>
              <div className={styles.headerTitle}>AI Tutor</div>
              <div className={styles.headerSub}>{language === 'ur' ? 'Physical AI & Humanoid Robotics' : 'AI Physical Humanoids Robotics Engineering'}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                className={styles.langBtn}
                onClick={() => {
                  const newLang = language === 'en' ? 'ur' : 'en'
                  setLanguage(newLang)
                  setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: newLang === 'ur' ? 'اب آپ اردو میں سوال پوچھ سکتے ہیں!' : 'You can now ask in English!'
                  }])
                }}
                title={language === 'en' ? 'Switch to Urdu' : 'Switch to English'}
              >
                {language === 'en' ? 'UR' : 'EN'}
              </button>
              <button className={styles.closeBtn} onClick={() => setOpen(false)}>✕</button>
            </div>
          </div>

          <div className={styles.messages}>
            {messages.map((msg, i) => (
              <div key={i} className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.assistantMessage}`}>
                {msg.content}
                {msg.sources && msg.sources.length > 0 && (
                  <div className={styles.sourceLinks}>
                    Sources: {msg.sources.map((s, j) => <a key={j} href={s} target="_blank" rel="noopener noreferrer">[{j + 1}]</a>)}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className={styles.typing}>
                <span>●</span><span>●</span><span>●</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.inputArea}>
            <textarea
              ref={inputRef}
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={language === 'ur' ? 'کتاب کے بارے میں پوچھیں...' : 'Ask about the textbook...'}
              rows={1}
            />
            <button
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  )
}
