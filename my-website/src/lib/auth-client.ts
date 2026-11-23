import { buildApiUrl } from './api'

const TOKEN_KEY = 'physical_ai_auth_token'

interface SignInArgs {
  email: string
  password: string
}

interface SignUpArgs {
  email: string
  password: string
  name?: string
  role?: string
  skillLevel?: string
  [key: string]: unknown
}

function readToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function writeToken(token: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
  } catch {
    return
  }
}

function clearToken(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    return
  }
}

async function request(path: string, init: RequestInit = {}): Promise<any> {
  const url = buildApiUrl(path)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  }
  const token = readToken()
  if (token) headers.Authorization = `Bearer ${token}`

  console.log('[auth] request', init.method || 'GET', url)

  let response: Response
  try {
    response = await fetch(url, { ...init, headers })
  } catch (err: any) {
    console.error('[auth] fetch failed', url, err)
    throw new Error(`Cannot reach backend at ${url}. ${err?.message || ''}`.trim())
  }

  console.log('[auth] response', response.status, url)

  let data: any = {}
  try {
    data = await response.json()
  } catch {
    // empty or non-JSON response
  }

  if (!response.ok) {
    const detail = data?.detail ?? data?.error ?? data?.message
    const message =
      typeof detail === 'string'
        ? detail
        : detail
          ? JSON.stringify(detail)
          : `Request failed (HTTP ${response.status})`
    throw new Error(message)
  }

  return data
}

export const authClient = {
  signIn: {
    email: async ({ email, password }: SignInArgs) => {
      const data = await request('/api/v1/auth/sign-in', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      if (data?.token) writeToken(data.token)
      return { data, error: null }
    },
  },
  signUp: {
    email: async ({ email, password, name, role, skillLevel }: SignUpArgs) => {
      const data = await request('/api/v1/auth/sign-up', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, role, skillLevel }),
      })
      if (data?.token) writeToken(data.token)
      return { data, error: null }
    },
  },
  getSession: async () => {
    if (!readToken()) return { data: null, error: null }
    try {
      const data = await request('/api/v1/auth/profile')
      if (data?.user) return { data: { user: data.user }, error: null }
      return { data: null, error: null }
    } catch {
      clearToken()
      return { data: null, error: null }
    }
  },
  signOut: async () => {
    clearToken()
    return { error: null }
  },
}
