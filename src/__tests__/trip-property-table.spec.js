import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TripPropertyTable from '@/features/trip/components/TripPropertyTable.vue'

function mountTable(trip) {
  return mount(TripPropertyTable, { props: { trip } })
}

describe('TripPropertyTable — 지역/스타일/동행/예산 반영', () => {
  it('지역·스타일·동행이 표시되고 미정이 아니다', () => {
    const w = mountTable({
      start_date: '2026-07-01',
      end_date: '2026-07-02',
      region: '제주특별자치도 제주시',
      styles: ['바다', '맛집'],
      members: [{ id: 'u1', name: '김태호', initial: '김', color: 'var(--collab-1)' }],
      budgetLabel: '',
      data: { items: [] },
    })
    const text = w.text()
    expect(text).toContain('제주특별자치도 제주시')
    expect(text).toContain('바다')
    expect(text).toContain('맛집')
    expect(text).toContain('김태호')
  })

  it('예산은 블록 예산 합계를 보여준다(블록 예산 추가 시 반영)', () => {
    const w = mountTable({
      start_date: '2026-07-01',
      end_date: '2026-07-01',
      region: null,
      styles: [],
      members: [],
      budgetLabel: '',
      data: {
        items: [
          { id: 'b1', properties: { budget: 12000 } },
          { id: 'b2', properties: { budget: 8000 } },
          { id: 'b3', properties: {} },
        ],
      },
    })
    expect(w.text()).toContain('20,000원') // 12,000 + 8,000
  })

  it('트립 레벨 budgetLabel 이 있으면 그것을 우선한다', () => {
    const w = mountTable({
      start_date: '2026-07-01',
      end_date: '2026-07-01',
      region: null,
      styles: [],
      members: [],
      budgetLabel: '1인 18만원',
      data: { items: [{ id: 'b1', properties: { budget: 5000 } }] },
    })
    expect(w.text()).toContain('1인 18만원')
  })

  it('예산이 없으면 미정', () => {
    const w = mountTable({
      start_date: '2026-07-01',
      end_date: '2026-07-01',
      region: null,
      styles: [],
      members: [],
      budgetLabel: '',
      data: { items: [{ id: 'b1', properties: {} }] },
    })
    // 예산 행이 '미정'
    expect(w.text()).toContain('미정')
  })
})
