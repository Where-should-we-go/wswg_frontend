// 모바일(<768px) 여부를 반응형으로 알려주는 작은 컴포저블.
import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useIsMobile(breakpoint = 768) {
  const isMobile = ref(false)
  let mql = null

  function update() {
    isMobile.value = mql ? mql.matches : false
  }

  onMounted(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    update()
    mql.addEventListener('change', update)
  })

  onBeforeUnmount(() => {
    if (mql) mql.removeEventListener('change', update)
  })

  return { isMobile }
}
