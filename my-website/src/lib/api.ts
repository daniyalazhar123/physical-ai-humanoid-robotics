const globalProcess =
  typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined

let configuredBaseUrl = ''

export function setApiBaseUrl(url: string): void {
  configuredBaseUrl = (url || '').replace(/\/+$/, '')
}

export function getApiBaseUrl(): string {
  if (configuredBaseUrl) return configuredBaseUrl
  const envUrl = globalProcess?.env?.NEXT_PUBLIC_API_URL
  return envUrl ? String(envUrl).replace(/\/+$/, '') : ''
}

export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl()
  if (!base) {
    throw new Error('Backend URL not configured. Set NEXT_PUBLIC_API_URL in Vercel and redeploy.')
  }
  return base + (path.startsWith('/') ? path : `/${path}`)
}
