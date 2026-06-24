import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import TripBoardView from '@/features/trip/components/TripBoardView.vue'

// 보드 카드 드롭이 board-drop(dragId, date, targetId, pos) 로 정확히 전달되는지.
const RECT = { top: 100, left: 0, height: 80, width: 240, right: 240, bottom: 180, x: 0, y: 100 }

function mountBoard() {
  return mount(TripBoardView, {
    props: {
      days: [
        {
          date: '2026-07-01',
          dayIndex: 1,
          blocks: [
            { id: 'b1', type: '관광', title: 'A', time: '10:00', durationMin: 60, properties: {} },
            { id: 'b2', type: '식당', title: 'B', time: '12:00', durationMin: 60, properties: {} },
          ],
        },
      ],
    },
    attachTo: document.body,
  })
}

function fire(el, type, clientY) {
  el.dispatchEvent(new MouseEvent(type, { clientY, bubbles: true, cancelable: true }))
}

describe('TripBoardView — 카드 위치 드롭', () => {
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      ...RECT,
      toJSON: () => RECT,
    })
  })
  afterEach(() => {
    vi.restoreAllMocks()
    document.querySelectorAll('[draggable]').forEach((n) => n.remove())
  })

  it('카드 하단에 드롭하면 board-drop(dragId, date, targetId, after)', async () => {
    const wrapper = mountBoard()
    await nextTick()
    const cards = wrapper.findAll('[draggable="true"]')
    expect(cards.length).toBe(2)
    // b1 을 잡고 b2 하단(after)으로.
    fire(cards[0].element, 'dragstart')
    await nextTick()
    fire(cards[1].element, 'dragover', 170) // 중점 140, 170>140 → after
    await nextTick()
    fire(cards[1].element, 'drop', 170)
    await nextTick()
    expect(wrapper.emitted('board-drop').at(-1)).toEqual(['b1', '2026-07-01', 'b2', 'after'])
    wrapper.unmount()
  })

  it('카드 상단에 드롭하면 before 로 전달', async () => {
    const wrapper = mountBoard()
    await nextTick()
    const cards = wrapper.findAll('[draggable="true"]')
    fire(cards[1].element, 'dragstart') // b2 를 잡고
    await nextTick()
    fire(cards[0].element, 'dragover', 110) // b1 상단 → before
    await nextTick()
    fire(cards[0].element, 'drop', 110)
    await nextTick()
    expect(wrapper.emitted('board-drop').at(-1)).toEqual(['b2', '2026-07-01', 'b1', 'before'])
    wrapper.unmount()
  })
})
