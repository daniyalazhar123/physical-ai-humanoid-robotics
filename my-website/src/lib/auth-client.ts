import { createAuthClient } from 'better-auth/client'

const envApiUrl =
  typeof process !== 'undefined' && process.env
    ? process.env.NEXT_PUBLIC_API_URL
    : undefined

const baseURL = envApiUrl || 'http://localhost:3001/api/auth'

export { createAuthClient }
export const authClient = createAuthClient({ baseURL })
