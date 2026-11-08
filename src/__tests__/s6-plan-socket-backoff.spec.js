// planSocket 재연결 — 지수 백오프(1s → 2s → 4s … 최대 30s), 연결 성공 시 간격 초기화.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPlanSocket, reconnectDelay } from '@/features/trip/lib/planSocket'

class FakeWebSocket {
  static OPEN = 1
  static instances = []
  constructor(url) {
    this.url = url
    this.readyState = 0
    FakeWebSocket.instances.push(this)
  }
  send() {}
  close() {
    this.onclose?.()
  }
  // 테스트 헬퍼
  open() {
    this.readyState = FakeWebSocket.OPEN
    this.onopen?.()
  }
  drop() {
    this.readyState = 3
    this.onclose?.()
  }
}

describe('reconnectDelay', () => {
  it('시도 횟수에 따라 2배씩 늘고 30초에서 멈춘다(지터 없음 기준)', () => {
    const noJitter = () => 0.5
    expect(reconnectDelay(0, noJitter)).toBe(1000)
    expect(reconnectDelay(1, noJitter)).toBe(2000)
    expect(reconnectDelay(2, noJitter)).toBe(4000)
    expect(reconnectDelay(5, noJitter)).toBe(30000)
    expect(reconnectDelay(20, noJitter)).toBe(30000)
  })

  it('지터는 기준 간격의 50~150% 범위다', () => {
    expect(reconnectDelay(1, () => 0)).toBe(1000)
    expect(reconnectDelay(1, () => 0.999)).toBeLessThan(3000)
  })
})

describe('createPlanSocket 재연결', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.5) // 지터 제거
    FakeWebSocket.instances = []
    vi.stubGlobal('WebSocket', FakeWebSocket)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('연속 실패 시 재연결 간격이 지수적으로 늘어난다', () => {
    createPlanSocket({ tripId: 1, token: 't' })
    expect(FakeWebSocket.instances).toHaveLength(1)

    FakeWebSocket.instances[0].drop()
    vi.advanceTimersByTime(999)
    expect(FakeWebSocket.instances).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(FakeWebSocket.instances).toHaveLength(2) // 1s 후 재시도

    FakeWebSocket.instances[1].drop()
    vi.advanceTimersByTime(1999)
    expect(FakeWebSocket.instances).toHaveLength(2)
    vi.advanceTimersByTime(1)
    expect(FakeWebSocket.instances).toHaveLength(3) // 2s 후 재시도
  })

  it('연결에 성공하면 간격이 처음(1s)으로 돌아간다', () => {
    createPlanSocket({ tripId: 1, token: 't' })
    FakeWebSocket.instances[0].drop()
    vi.advanceTimersByTime(1000)
    FakeWebSocket.instances[1].drop()
    vi.advanceTimersByTime(2000)

    FakeWebSocket.instances[2].open()
    FakeWebSocket.instances[2].drop()
    vi.advanceTimersByTime(1000)
    expect(FakeWebSocket.instances).toHaveLength(4)
  })

  it('close() 후에는 재연결하지 않는다', () => {
    const s = createPlanSocket({ tripId: 1, token: 't' })
    s.close()
    vi.advanceTimersByTime(60000)
    expect(FakeWebSocket.instances).toHaveLength(1)
  })
})
