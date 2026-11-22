import { useState, useCallback } from 'react'

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
      const response = await fetch('/api/v1/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLang: targetLang === 'ur' ? 'ur' : targetLang,
        }),
      })

      const data = await response.json()
      if (!response.ok || data.error) {
        setResult({ translatedText: '', isLoading: false, error: data.error || 'Translation failed' })
      } else {
        setResult({
          translatedText: data.translatedText || 'Translation unavailable',
          isLoading: false,
          error: null,
        })
      }
    } catch (err: any) {
      setResult({ translatedText: '', isLoading: false, error: err.message })
    }
  }, [])

  const reset = useCallback(() => {
    setResult({ translatedText: '', isLoading: false, error: null })
  }, [])

  return { ...result, translate, reset }
}
