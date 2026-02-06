import { inject, provide, type Ref, type InjectionKey } from 'vue'

export interface AnimationCoords {
  register: (key: string, el: Ref<HTMLElement | null>) => void
  unregister: (key: string) => void
  getRect: (key: string) => DOMRect | null
  getCenter: (key: string) => { x: number; y: number } | null
}

const ANIMATION_COORDS_KEY: InjectionKey<AnimationCoords> = Symbol('animationCoords')

/**
 * Creates the animation coords provider. Call once at the top level (GameView).
 */
export function provideAnimationCoords(): AnimationCoords {
  const elements = new Map<string, Ref<HTMLElement | null>>()

  const coords: AnimationCoords = {
    register(key: string, el: Ref<HTMLElement | null>) {
      elements.set(key, el)
    },

    unregister(key: string) {
      elements.delete(key)
    },

    getRect(key: string): DOMRect | null {
      const elRef = elements.get(key)
      const el = elRef?.value
      if (!el) return null
      return el.getBoundingClientRect()
    },

    getCenter(key: string): { x: number; y: number } | null {
      const rect = this.getRect(key)
      if (!rect) return null
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      }
    }
  }

  provide(ANIMATION_COORDS_KEY, coords)
  return coords
}

/**
 * Injects the animation coords from a parent provider.
 * Call in any child component that needs to register or read positions.
 */
export function useAnimationCoords(): AnimationCoords {
  const coords = inject(ANIMATION_COORDS_KEY)
  if (!coords) {
    throw new Error('useAnimationCoords() requires provideAnimationCoords() in a parent component')
  }
  return coords
}
