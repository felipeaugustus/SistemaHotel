import { refreshTokens } from '../auth/auth'
import { clearTokens, getTokens } from '../auth/tokens'

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(status: number, data: unknown) {
    super(`Erro ${status} na API`)
    this.status = status
    this.data = data
  }
}

function send(path: string, options: RequestInit): Promise<Response> {
  const headers = new Headers(options.headers)
  const tokens = getTokens()
  if (tokens) headers.set('Authorization', `Bearer ${tokens.accessToken}`)
  if (options.body) headers.set('Content-Type', 'application/json')

  return fetch(path, { ...options, headers })
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response = await send(path, options)

  if (response.status === 401 && (await refreshTokens())) {
    response = await send(path, options)
  }
  if (response.status === 401) {
    clearTokens()
    window.location.assign('/login')
  }

  const data = response.status === 204 ? undefined : await response.json()
  if (!response.ok) throw new ApiError(response.status, data)
  return data
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError && error.data && typeof error.data === 'object') {
    const data = error.data as Record<string, unknown>
    if (typeof data.detail === 'string') return data.detail
    return Object.values(data).flat().join(' ')
  }
  return 'Algo deu errado. Tente novamente.'
}
