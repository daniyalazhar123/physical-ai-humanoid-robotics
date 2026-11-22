import { createAuthClient } from 'better-auth/client'

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/auth'

export { createAuthClient }
export const authClient = createAuthClient({ baseURL })
