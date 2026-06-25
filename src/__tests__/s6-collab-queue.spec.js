// S6 실시간 공동편집 — 미확인 op 큐(Phase 1+2) 동작 검증.
//   · 실시간 모드에서는 편집을 PUT 으로 폴백하지 않고 clientOpId 붙여 큐에 적재한다.
//   · ack 수신 시 큐에서 제거, PLAN_EDIT_BUSY 는 백오프 재시도, 끊겼다 재연결되면 재전송.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, h as createElement, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

// 실시간 모드 강제(USE_MOCK=false).
vi.mock('@/services/config', () => ({
  USE_MOCK: false,
  mockDelay: () => Promise.resolve(),
  toQuery: () => '',
}))

// 토큰 보유(로그인) 상태.
vi.mock('@/services/auth', () => ({
  getAccessToken: () => 'header.eyJzdWIiOiJ1MSJ9.sig',
}))

// trips 서비스는 스파이로 — PUT/PATCH 가 호출되는지 감시.
const updateTrip = vi.fn(() => Promise.resolve({}))
const updateTripMeta = vi.fn(() => Promise.resolve({}))
vi.mock('@/services/trips', () => ({
  updateTrip: (...a) => updateTrip(...a),
  updateTripMeta: (...a) => updateTripMeta(...a),
}))

// planSocket 을 제어 가능한 가짜로 교체.
const sock = vi.hoisted(() => ({ onMessage: null, onStatus: null, sent: [], open: true, closed: false }))
vi.mock('@/features/trip/lib/planSocket', () => ({
  createPlanSocket: ({ onMessage, onStatus }) => {
    sock.onMessage = onMessage
    sock.onStatus = onStatus
    return {
      send(op) {
        if (!sock.open) return false
        sock.sent.push(op)
        return true
      },
      get ready() {
        return sock.open
      },
      close() {
        sock.closed = true
      },
    }
  },
  userIdFromToken: () => 'u1',
}))

import { useTripEditor } from '@/features/trip/lib/useTripEditor'

function makeTrip() {
  return {
    trip_id: 10,
    title: '여행',
    start_date: '2026-01-01',
    end_date: '2026-01-02',
    members: [],
    data: {
      meta: {},
      items: [{ id: 'b1', type: '관광', title: '', visitDate: '2026-01-01', order: 1, properties: {} }],
    },
  }
}

function mountEditor(trip) {
  let api
  const Comp = defineComponent({
    setup() {
      api = useTripEditor(trip)
      return () => createElement('div')
    },
  })
  const wrapper = mount(Comp)
  return { api, wrapper }
}

function lastSent() {
  return sock.sent[sock.sent.length - 1]
}

describe('useTripEditor 실시간 op 큐', () => {
  beforeEach(() => {
    sock.onMessage = null
    sock.onStatus = null
    sock.sent = []
    sock.open = true
    sock.closed = false
    updateTrip.mockClear()
    updateTripMeta.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('편집 시 PUT 대신 clientOpId 를 붙여 op 를 송신한다', () => {
    const { api } = mountEditor(makeTrip())
    expect(api.realtimeEnabled).toBe(true)

    api.patchBlock('b1', { title: '경복궁' })

    const op = sock.sent.find((s) => s.type === 'block.update')
    expect(op).toBeTruthy()
    expect(op.payload.clientOpId).toMatch(/:/)
    expect(op.payload.patch.title).toBe('경복궁')
    expect(updateTrip).not.toHaveBeenCalled() // 실시간 모드는 전체 PUT 폴백 없음
    expect(api.syncState.value).toBe('saving')
  })

  it('ack 를 받으면 pending 이 비고 synced 가 된다', async () => {
    const { api } = mountEditor(makeTrip())
    api.patchBlock('b1', { title: '경복궁' })
    const op = sock.sent.find((s) => s.type === 'block.update')

    sock.onMessage({ type: 'ack', payload: { clientOpId: op.payload.clientOpId } })
    await nextTick()

    expect(api.syncState.value).toBe('synced')
  })

  it('PLAN_EDIT_BUSY 는 폐기하지 않고 백오프 재시도한다', () => {
    vi.useFakeTimers()
    const { api } = mountEditor(makeTrip())
    api.patchBlock('b1', { title: 'A' })
    const op = sock.sent.find((s) => s.type === 'block.update')
    const before = sock.sent.length

    sock.onMessage({ type: 'error', payload: { code: 'PLAN_EDIT_BUSY', clientOpId: op.payload.clientOpId } })
    vi.advanceTimersByTime(500) // 백오프 경과 → 재전송

    expect(sock.sent.length).toBe(before + 1)
    expect(lastSent().payload.clientOpId).toBe(op.payload.clientOpId)
    expect(api.syncState.value).toBe('saving')
  })

  it('STALE 는 조용히 폐기한다(재시도 안 함)', async () => {
    const { api } = mountEditor(makeTrip())
    api.patchBlock('b1', { title: 'A' })
    const op = sock.sent.find((s) => s.type === 'block.update')

    sock.onMessage({ type: 'error', payload: { code: 'STALE', clientOpId: op.payload.clientOpId } })
    await nextTick()

    expect(api.syncState.value).toBe('synced') // pending 비었음
  })

  it('소켓이 끊겨 있으면 큐에 쌓였다가 재연결(sync) 후 재전송한다', async () => {
    const { api } = mountEditor(makeTrip())

    sock.open = false // 연결 끊김
    api.patchBlock('b1', { title: '끊긴 동안 입력' })
    expect(sock.sent.filter((s) => s.type === 'block.update')).toHaveLength(0) // 아직 못 보냄
    expect(updateTrip).not.toHaveBeenCalled() // PUT 폴백도 안 함(유실 방지)

    // 재연결: 서버 스냅샷(sync) 도착 → pending 재전송.
    sock.open = true
    sock.onStatus?.('open')
    sock.onMessage({
      type: 'sync',
      payload: { data: { meta: {}, items: makeTrip().data.items }, presence: [], lastSeq: '0-0' },
    })
    await nextTick()

    const resent = sock.sent.filter((s) => s.type === 'block.update')
    expect(resent).toHaveLength(1)
    expect(resent[0].payload.patch.title).toBe('끊긴 동안 입력')
  })
})
