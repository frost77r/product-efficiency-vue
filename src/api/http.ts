import type { ApiResponse } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const AI_API_BASE_URL = import.meta.env.VITE_AI_API_BASE_URL ?? API_BASE_URL

export async function postJson<TResponse, TRequest extends object = Record<string, never>>(url: string, body: TRequest): Promise<TResponse> {
  const baseUrl = url.startsWith('/ai') ? AI_API_BASE_URL : API_BASE_URL
  const response = await fetch(`${baseUrl}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }

  const result = (await response.json()) as ApiResponse<TResponse>
  if (result.code !== 0) {
    throw new Error(result.message || 'API business error')
  }

  return result.data
}

export async function fetchGet<TResponse>(url: string): Promise<TResponse> {
  const baseUrl = url.startsWith('/ai') ? AI_API_BASE_URL : API_BASE_URL
  const response = await fetch(`${baseUrl}${url}`, {
    method: 'GET'
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }

  const result = (await response.json()) as ApiResponse<TResponse>
  if (result.code !== 0) {
    throw new Error(result.message || 'API business error')
  }

  return result.data
}
