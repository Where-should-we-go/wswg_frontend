import { authFetch } from './auth'

async function readError(res) {
  let message = null

  try {
    const body = await res.json()
    if (body && typeof body.message === 'string') {
      message = body.message
    }
  } catch {
    message = null
  }

  if (!message) {
    message = `요청에 실패했어요. (HTTP ${res.status})`
  }

  return new Error(message)
}

export async function apiGet(path) {
  const res = await authFetch(path)

  if (!res.ok) {
    throw await readError(res)
  }

  if (res.status === 204) {
    return null
  }

  const text = await res.text()
  if (!text) {
    return null
  }

  return JSON.parse(text)
}

export async function apiPost(path, body) {
  const res = await authFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw await readError(res)
  }

  if (res.status === 204) {
    return null
  }

  const text = await res.text()
  if (!text) {
    return null
  }

  return JSON.parse(text)
}
