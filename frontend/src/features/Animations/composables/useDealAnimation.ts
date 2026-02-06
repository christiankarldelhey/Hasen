import { ref, type Ref } from 'vue'
import type { AnimationCoords } from './useAnimationCoords'

export interface AnimatedCard {
  id: string
  targetKey: string
  startX: number
  startY: number
  endX: number
  endY: number
  delay: number
  duration: number
}

interface DealAnimationOptions {
  coords: AnimationCoords
  cardDuration?: number
  cardDelay?: number
}

export function useDealAnimation(options: DealAnimationOptions) {
  const { coords, cardDuration = 600, cardDelay = 225 } = options

  const isDealing: Ref<boolean> = ref(false)
  const animatedCards: Ref<AnimatedCard[]> = ref([])
  const dealProgress: Ref<Record<string, number>> = ref({})

  function waitForCoords(keys: string[], maxWait = 2000, interval = 50): Promise<boolean> {
    return new Promise((resolve) => {
      const start = Date.now()
      const check = () => {
        if (keys.every(k => coords.getRect(k) !== null)) {
          resolve(true)
          return
        }
        if (Date.now() - start >= maxWait) {
          resolve(false)
          return
        }
        setTimeout(check, interval)
      }
      check()
    })
  }

  async function startDeal(playerKeys: string[], cardsPerPlayer = 5): Promise<void> {
    const allKeys = ['deck', ...playerKeys]
    const ready = await waitForCoords(allKeys)
    if (!ready) return

    return new Promise((resolve) => {
      const deckRect = coords.getRect('deck')
      if (!deckRect) {
        resolve()
        return
      }

      const deckCenter = {
        x: deckRect.left + deckRect.width / 2,
        y: deckRect.top + deckRect.height / 2
      }

      const cards: AnimatedCard[] = []
      let index = 0

      const progress: Record<string, number> = {}
      for (const key of playerKeys) {
        progress[key] = 0
      }
      dealProgress.value = { ...progress }

      for (let round = 0; round < cardsPerPlayer; round++) {
        for (const key of playerKeys) {
          const targetRect = coords.getRect(key)
          if (!targetRect) continue

          const targetCenter = {
            x: targetRect.left + targetRect.width / 2,
            y: targetRect.top + targetRect.height / 2
          }

          cards.push({
            id: `deal-${round}-${key}-${Date.now()}`,
            targetKey: key,
            startX: deckCenter.x,
            startY: deckCenter.y,
            endX: targetCenter.x,
            endY: targetCenter.y,
            delay: index * cardDelay,
            duration: cardDuration,
          })

          index++
        }
      }

      if (cards.length === 0) {
        resolve()
        return
      }

      isDealing.value = true
      animatedCards.value = cards

      const totalTime = (cards.length - 1) * cardDelay + cardDuration + 200

      for (const card of cards) {
        setTimeout(() => {
          const current = dealProgress.value[card.targetKey] ?? 0
          dealProgress.value = {
            ...dealProgress.value,
            [card.targetKey]: current + 1
          }
        }, card.delay + cardDuration + 50)
      }

      setTimeout(() => {
        animatedCards.value = []
        isDealing.value = false
        dealProgress.value = {}
        resolve()
      }, totalTime)
    })
  }

  return {
    isDealing,
    animatedCards,
    dealProgress,
    startDeal
  }
}
