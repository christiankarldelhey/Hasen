import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Reads a px-valued CSS custom property from :root and keeps it updated
 * on window resize (media-query driven overrides).
 */
export function useCssPxVar(name: string, fallback: number) {
  const value = ref(fallback)

  const read = () => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name)
    const parsed = parseFloat(raw)
    value.value = Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
  }

  onMounted(read)
  window.addEventListener('resize', read)
  onUnmounted(() => window.removeEventListener('resize', read))

  return value
}
