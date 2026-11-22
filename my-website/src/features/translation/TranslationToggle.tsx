import React from 'react'
import { useTranslation } from './useTranslation'

interface TranslationToggleProps {
  text: string
  label?: string
}

export default function TranslationToggle({ text, label = 'Translate to Urdu' }: TranslationToggleProps) {
  const { translatedText, isLoading, error, translate, reset } = useTranslation()

  return (
    <div>
      <button
        onClick={() => {
          if (translatedText) {
            reset()
          } else {
            translate(text)
          }
        }}
        disabled={isLoading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '0.4rem 0.8rem',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.04)',
          color: 'var(--ifm-font-color-base)',
          cursor: 'pointer',
          fontSize: '0.85rem',
        }}
      >
        <span>{translatedText ? '🔤' : '🌐'}</span>
        {isLoading ? 'Translating...' : translatedText ? 'Show Original' : label}
      </button>

      {translatedText && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            direction: 'rtl',
            fontFamily: '"Noto Nastaliq Urdu", serif',
            fontSize: '1.1rem',
            lineHeight: 1.8,
          }}
        >
          {translatedText}
        </div>
      )}

      {error && (
        <p style={{ color: '#ff6b6b', fontSize: '0.85rem', marginTop: 4 }}>{error}</p>
      )}
    </div>
  )
}
