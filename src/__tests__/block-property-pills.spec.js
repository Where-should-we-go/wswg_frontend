import { describe, it, expect } from 'vitest'
import { propertyPills } from '@/features/trip/lib/blockMeta'

describe('propertyPills — AI 내부 메타는 노출하지 않는다', () => {
  it('source·score·similarity·matched*·meal 은 pill 로 나오지 않는다', () => {
    const pills = propertyPills({
      source: 'AI_RECOMMENDATION',
      score: 0.606,
      similarity: 0.5364430062491755,
      matchedCandidateId: 'c1',
      matchedCandidateName: '성산일출봉',
      meal: '저녁',
    })
    expect(pills).toEqual([])
  })

  it('사용자용 속성(budget·rating·memo)은 그대로 노출된다', () => {
    const keys = propertyPills({ budget: 12000, rating: 4.5, memo: '맛집' }).map((p) => p.key)
    expect(keys).toContain('budget')
    expect(keys).toContain('rating')
    expect(keys).toContain('memo')
  })

  it('AI 메타와 사용자 속성이 섞여 있으면 사용자 속성만 남는다', () => {
    const keys = propertyPills({
      source: 'AI_RECOMMENDATION',
      score: 0.8,
      memo: '바다 뷰',
    }).map((p) => p.key)
    expect(keys).toEqual(['memo'])
  })
})
