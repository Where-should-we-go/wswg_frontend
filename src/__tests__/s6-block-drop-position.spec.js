import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import TripBlock from '@/features/trip/components/TripBlock.vue'

// 드롭 위치: 블록 상단 절반=before(위), 하단 절반=after(아래).
// (아래로 삽입이 안 되던 버그 회귀 방지 — 하단에 놓으면 'after' 가 나와야 한다.)
const RECT = { top: 100, left: 0, height: 80, width: 200, right: 200, bottom: 180, x: 0, y: 100 }

function mountBlock() {
  return mount(TripBlock, {
    props: {
      block: { id: 'b1', type: '식당', title: '정육식당', properties: {}, media: [] },
    },
    attachTo: document.body,
  })
}

function fire(el, type, clientY) {
  el.dispatchEvent(new MouseEvent(type, { clientY, bubbles: true, cancelable: true }))
}

describe('TripBlock — 드롭 위치(위/아래) 판정', () => {
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      ...RECT,
      toJSON: () => RECT,
    })
  })
  afterEach(() => vi.restoreAllMocks())

  it('상단 절반에 드롭하면 before(위)로 emit 한다', async () => {
    const wrapper = mountBlock()
    fire(wrapper.element, 'dragover', 110) // top=100, height=80 → 중점 140, 110<140 → before
    await nextTick()
    fire(wrapper.element, 'drop', 110)
    await nextTick()
    expect(wrapper.emitted('reorder-drop').at(-1)).toEqual(['b1', 'before'])
    wrapper.unmount()
  })

  it('하단 절반에 드롭하면 after(아래)로 emit 한다', async () => {
    const wrapper = mountBlock()
    fire(wrapper.element, 'dragover', 170) // 170>140 → after
    await nextTick()
    fire(wrapper.element, 'drop', 170)
    await nextTick()
    expect(wrapper.emitted('reorder-drop').at(-1)).toEqual(['b1', 'after'])
    wrapper.unmount()
  })

  it('하단 미디어(＋사진) 영역 위로 블록을 끌어도 reorder 가 막히지 않는다(after 버블)', async () => {
    const wrapper = mountBlock()
    // ＋사진 영역(미디어 드롭존) 안의 요소에서 발생한 블록 드래그 이벤트도 블록으로 버블돼야 한다.
    const photoBtn = wrapper.find('button[aria-label="파일 추가"]')
    expect(photoBtn.exists()).toBe(true)
    // dataTransfer 없는(=파일 아닌, 블록 reorder) 드래그 → 미디어존이 가로채지 않고 버블.
    fire(photoBtn.element, 'dragover', 170) // 하단 → after
    await nextTick()
    fire(photoBtn.element, 'drop', 170)
    await nextTick()
    expect(wrapper.emitted('reorder-drop').at(-1)).toEqual(['b1', 'after'])
    wrapper.unmount()
  })
})
