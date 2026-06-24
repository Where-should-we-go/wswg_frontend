import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import TripCalendar from '@/features/trip/components/TripCalendar.vue'

// 드래그 클론이 커서를 X·Y 1:1 로 따라가는지 검증.
// jsdom 은 레이아웃이 없으므로 getBoundingClientRect 를 고정값으로 목킹한다.
const RECT = { left: 10, top: 20, width: 150, height: 80, right: 160, bottom: 100, x: 10, y: 20 }

describe('TripCalendar — 드래그 클론이 커서를 따라간다', () => {
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      ...RECT,
      toJSON: () => RECT,
    })
  })
  afterEach(() => {
    vi.restoreAllMocks()
    document.querySelectorAll('.fixed').forEach((n) => n.remove())
  })

  it('pointerdown 후 pointermove 하면 fixed 클론의 left/top 이 포인터를 따른다', async () => {
    const wrapper = mount(TripCalendar, {
      props: {
        startDate: '2026-07-01',
        items: [
          {
            id: 'b1',
            title: '경복궁',
            type: '관광',
            visitDate: '2026-07-01',
            time: '10:00',
            durationMin: 120,
            order: 1,
            media: [],
            properties: {},
          },
        ],
      },
      attachTo: document.body,
    })
    await nextTick()

    // 캘린더 이벤트 카드(.ev)를 잡는다.
    const card = wrapper.find('.ev')
    expect(card.exists()).toBe(true)
    card.element.dispatchEvent(
      new MouseEvent('pointerdown', { clientX: 50, clientY: 50, button: 0, bubbles: true }),
    )
    await nextTick()

    // 커서 이동.
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 200, clientY: 300 }))
    await nextTick()

    // body 로 Teleport 된 클론.
    const clone = document.querySelector('.fixed.z-\\[100\\]')
    expect(clone).toBeTruthy()
    // grabDX = 50 - 10 = 40 → left = 200 - 40 = 160. grabDY = 50 - 20 = 30 → top = 300 - 30 = 270.
    expect(clone.style.left).toBe('160px')
    expect(clone.style.top).toBe('270px')
    // 실제 블록 제목이 담긴 카드(충실한 클론).
    expect(clone.textContent).toContain('경복궁')

    // 한 번 더 이동하면 계속 따라온다.
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 260, clientY: 360 }))
    await nextTick()
    expect(clone.style.left).toBe('220px') // 260 - 40
    expect(clone.style.top).toBe('330px') // 360 - 30

    window.dispatchEvent(new MouseEvent('pointerup', {}))
    await nextTick()
    // 놓으면 클론이 사라진다.
    expect(document.querySelector('.fixed.z-\\[100\\]')).toBeFalsy()
    wrapper.unmount()
  })
})
