import { useAuth } from '../auth'

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced'

export function useLevel() {
  const { user } = useAuth()

  const level: SkillLevel = (user?.skillLevel as SkillLevel) || 'Beginner'

  const getExplanation = (
    beginner: string,
    intermediate: string,
    advanced: string
  ): string => {
    switch (level) {
      case 'Beginner':
        return beginner
      case 'Intermediate':
        return intermediate
      case 'Advanced':
        return advanced
      default:
        return beginner
    }
  }

  return { level, getExplanation, isLoggedIn: !!user }
}
