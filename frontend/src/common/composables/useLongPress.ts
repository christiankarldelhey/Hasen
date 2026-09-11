interface PressHandlers {
  onPointerdown: (event: PointerEvent) => void
  onPointerup: (event: PointerEvent) => void
  onPointermove: (event: PointerEvent) => void
  onPointercancel: () => void
  onContextmenu: (event: Event) => void
}

interface LongPressOptions {
  /** ms before the press counts as a long press */
  delay?: number
  /** px of movement allowed before the press is cancelled */
  moveTolerance?: number
}

/**
 * Tap / long-press gesture for card elements.
 * Short press -> onTap. Press held >= delay -> onLongPress (tap suppressed).
 */
export function useLongPress(
  onLongPress: () => void,
  onTap: () => void,
  options: LongPressOptions = {}
): PressHandlers {
  const { delay = 450, moveTolerance = 12 } = options

  let timer: ReturnType<typeof setTimeout> | null = null
  let startX = 0
  let startY = 0
  let longPressed = false

  const clear = () => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  return {
    onPointerdown(event: PointerEvent) {
      longPressed = false
      startX = event.clientX
      startY = event.clientY
      clear()
      timer = setTimeout(() => {
        longPressed = true
        onLongPress()
      }, delay)
    },
    onPointerup() {
      clear()
      if (!longPressed) onTap()
    },
    onPointermove(event: PointerEvent) {
      if (timer === null) return
      const dx = event.clientX - startX
      const dy = event.clientY - startY
      if (dx * dx + dy * dy > moveTolerance * moveTolerance) clear()
    },
    onPointercancel() {
      clear()
    },
    // Prevent the iOS context menu / callout on long touch
    onContextmenu(event: Event) {
      event.preventDefault()
    },
  }
}
