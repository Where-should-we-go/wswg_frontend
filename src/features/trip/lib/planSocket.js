// planSocket — trips/{id} 실시간 공동편집 WebSocket 클라이언트.
// 백엔드 계약(F9-COLLAB-HANDOFF §3): raw WS, 엔드포인트 /ws/plans/{tripId}.
//   인증: 브라우저 WS 는 헤더를 못 실으므로 ?token=<accessToken> 쿼리로 전달.
//   송신: { type, tripId, payload } (actor/seq/ts 는 서버가 채움)
//   수신: sync | ack | error | block.add | block.update | block.remove | meta.update | presence
// 끊기면 자동 재연결(지수 백오프 + 지터). close() 호출 시 재연결 중단.

const RECONNECT_BASE_MS = 1000
const RECONNECT_MAX_MS = 30000

// attempt 번째 재연결까지 대기 시간. 1s → 2s → 4s … 최대 30s.
// 지터(기준의 50~150%)로 서버 재기동 시 모든 클라이언트가 같은 순간에 몰리는 것을 막는다.
export function reconnectDelay(attempt, random = Math.random) {
  const base = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** attempt)
  return Math.round(base * (0.5 + random()))
}

export function createPlanSocket({ tripId, token, onMessage, onStatus }) {
  let ws = null
  let closedByUser = false
  let reconnectTimer = null
  let attempt = 0 // 연속 실패 횟수 — 연결 성공 시 0 으로 초기화

  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  // vite dev 프록시(/ws → ws://localhost:8080)를 타도록 상대 host 사용.
  const url = `${proto}://${location.host}/ws/plans/${tripId}?token=${encodeURIComponent(token)}`

  function connect() {
    onStatus?.('connecting')
    try {
      ws = new WebSocket(url)
    } catch {
      scheduleReconnect()
      return
    }
    ws.onopen = () => {
      attempt = 0
      onStatus?.('open')
    }
    ws.onmessage = (e) => {
      let msg
      try {
        msg = JSON.parse(e.data)
      } catch {
        return
      }
      onMessage?.(msg)
    }
    ws.onerror = () => onStatus?.('error')
    ws.onclose = () => {
      onStatus?.('closed')
      scheduleReconnect()
    }
  }

  function scheduleReconnect() {
    if (closedByUser) return
    clearTimeout(reconnectTimer)
    // 상한(30s)에 도달한 뒤에는 지터가 상한을 넘기지 않도록 다시 한 번 자른다.
    const delay = Math.min(RECONNECT_MAX_MS, reconnectDelay(attempt))
    attempt += 1
    reconnectTimer = setTimeout(connect, delay)
  }

  connect()

  return {
    // op = { type, tripId, payload }. 연결 안 됐으면 false(상위 op 큐가 재연결 후 재전송).
    send(op) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(op))
        return true
      }
      return false
    },
    get ready() {
      return !!ws && ws.readyState === WebSocket.OPEN
    },
    close() {
      closedByUser = true
      clearTimeout(reconnectTimer)
      ws?.close()
    },
  }
}

// access token(JWT) 의 sub(=userId) 를 문자열로 추출. 실패하면 null.
export function userIdFromToken(token) {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(part)
        .split('')
        .map((ch) => '%' + ('00' + ch.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    const payload = JSON.parse(json)
    return payload.sub != null ? String(payload.sub) : null
  } catch {
    return null
  }
}
