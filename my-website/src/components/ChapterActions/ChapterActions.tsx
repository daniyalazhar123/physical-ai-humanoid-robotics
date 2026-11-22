import React from 'react'
import { FiTarget, FiGlobe, FiMessageSquare, FiEdit3, FiFileText } from 'react-icons/fi'
import styles from './ChapterActions.module.css'

interface ChapterActionsProps {
  chapterTitle?: string
  chapterContent?: string
  onAction?: (action: string, prompt?: string) => void
}

interface Action {
  id: string
  label: string
  icon: React.ReactNode
  prompt: string
}

export default function ChapterActions({ chapterTitle, chapterContent, onAction }: ChapterActionsProps) {
  const title = chapterTitle || 'this chapter'
  const preview = chapterContent ? chapterContent.slice(0, 200) : ''

  const actions: Action[] = [
    {
      id: 'personalize',
      label: 'Personalise',
      icon: <FiTarget />,
      prompt: `Help me personalise the content of "${title}" for my learning level.${preview ? ` Here's the content: ${preview}...` : ''}`,
    },
    {
      id: 'translate',
      label: 'Translate to Urdu',
      icon: <FiGlobe />,
      prompt: `Translate "${title}" to Urdu (اُردو). Preserve formatting and code blocks.${preview ? ` Content: ${preview}...` : ''}`,
    },
    {
      id: 'ask-ai',
      label: 'Ask AI',
      icon: <FiMessageSquare />,
      prompt: `I have a question about "${title}": `,
    },
    {
      id: 'quiz',
      label: 'Generate Quiz',
      icon: <FiEdit3 />,
      prompt: `Generate a quiz based on "${title}" with 5 multiple-choice questions and an answer key.${preview ? ` Content: ${preview}...` : ''}`,
    },
    {
      id: 'summarize',
      label: 'Summarize',
      icon: <FiFileText />,
      prompt: `Provide a concise summary of "${title}" covering the key concepts, main takeaways, and important definitions.${preview ? ` Content: ${preview}...` : ''}`,
    },
  ]

  const handleClick = (action: Action) => {
    if (onAction) {
      onAction(action.id, action.prompt)
    } else {
      const chatbot = document.querySelector('[aria-label="Toggle chatbot"]') as HTMLButtonElement
      if (chatbot) {
        chatbot.click()
        setTimeout(() => {
          const input = document.querySelector('textarea') as HTMLTextAreaElement
          if (input) {
            input.value = action.prompt
            input.dispatchEvent(new Event('input', { bubbles: true }))
            input.focus()
          }
        }, 400)
      }
    }
  }

  return (
    <div className={styles.container}>
      {actions.map((action) => (
        <button key={action.id} className={styles.actionBtn} onClick={() => handleClick(action)} title={action.label}>
          <span className={styles.icon}>{action.icon}</span>
          {action.label}
        </button>
      ))}
    </div>
  )
}
