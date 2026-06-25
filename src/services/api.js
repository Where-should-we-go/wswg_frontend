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

async function parseBody(res) {
  if (res.status === 204) {
    return null
  }

  const text = await res.text()
  if (!text) {
    return null
  }

  return JSON.parse(text)
}

async function sendJson(method, path, body) {
  const res = await authFetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw await readError(res)
  }

  return parseBody(res)
}

export function apiPost(path, body) {
  return sendJson('POST', path, body)
}

export function apiPut(path, body) {
  return sendJson('PUT', path, body)
}

export function apiPatch(path, body) {
  return sendJson('PATCH', path, body)
}

export async function apiDelete(path) {
  const res = await authFetch(path, { method: 'DELETE' })

  if (!res.ok) {
    throw await readError(res)
  }

  return parseBody(res)
}

// 멀티파트 업로드(미디어 등). FormData 는 Content-Type 을 브라우저가 설정.
export async function apiUpload(path, formData) {
  const res = await authFetch(path, { method: 'POST', body: formData })

  if (!res.ok) {
    throw await readError(res)
  }

  return parseBody(res)
}
