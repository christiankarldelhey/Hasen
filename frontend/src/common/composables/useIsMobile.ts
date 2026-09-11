import { ref, onUnmounted } from 'vue'

/**
 * Reactive flag for the mobile (portrait, single-column) layout.
 * Matches phones in both orientations and narrow windows (< 900px).
 * The desktop layout stays untouched at >= 900px.
 */
export function useIsMobile(query = '(max-width: 899px)') {
  const isMobile = ref(
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  )

  if (typeof window === 'undefined') return isMobile

  const mql = window.matchMedia(query)
  const onChange = (event: MediaQueryListEvent) => {
    isMobile.value = event.matches
  }

  mql.addEventListener('change', onChange)
  onUnmounted(() => mql.removeEventListener('change', onChange))

  return isMobile
}
