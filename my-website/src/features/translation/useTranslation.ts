import { useState, useCallback } from 'react'
import { buildApiUrl } from '../../lib/api'

interface TranslationResult {
  translatedText: string
  isLoading: boolean
  error: string | null
}

export function useTranslation() {
  const [result, setResult] = useState<TranslationResult>({
    translatedText: '',
    isLoading: false,
    error: null,
  })

  const translate = useCallback(async (text: string, targetLang: string = 'ur') => {
    if (!text.trim()) return

    setResult({ translatedText: '', isLoading: true, error: null })

    try {
      const url = buildApiUrl('/api/translate')
      console.log('[useTranslation] POST', url)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLang: targetLang === 'ur' ? 'ur' : targetLang,
        }),
      })
      console.log('[useTranslation] response', response.status, url)

      const data = await response.json().catch(() => ({}))
      if (!response.ok || data.error || data.detail || !data.translatedText) {
        setResult({ translatedText: '', isLoading: false, error: 'Translation failed, try again' })
      } else {
        setResult({
          translatedText: data.translatedText,
          isLoading: false,
          error: null,
        })
      }
    } catch (err: any) {
      console.error('[useTranslation] failed', err)
      setResult({ translatedText: '', isLoading: false, error: 'Translation failed, try again' })
    }
  }, [])

  const reset = useCallback(() => {
    setResult({ translatedText: '', isLoading: false, error: null })
  }, [])

  return { ...result, translate, reset }
}
