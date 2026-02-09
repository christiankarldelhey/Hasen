import { ref, type Ref } from 'vue'
import type { AnimationCoords } from './useAnimationCoords'
import type { AnimatedCard } from './useDealAnimation'
import type { PlayingCard } from '@domain/interfaces'
import type { PlayerId } from '@domain/interfaces/Player'

interface CardAnimationOptions {
  coords: AnimationCoords
  duration?: number
}

export function useCardAnimation(options: CardAnimationOptions) {
  const { coords, duration = 400 } = options

  const flyingCards: Ref<AnimatedCard[]> = ref([])
  const isAnimating: Ref<boolean> = ref(false)

  function resolvePlayerCoordKey(
    playerId: PlayerId,
    currentPlayerId: PlayerId | null,
    opponentPositions: { playerId: PlayerId; position: string }[]
  ): string | null {
    if (playerId === currentPlayerId) return 'player-hand'
    const opponent = opponentPositions.find(op => op.playerId === playerId)
    return opponent ? `opponent-${opponent.position}` : null
  }

  /**
   * Animate a card flying from the player's hand to the trick area.
   */
  function animatePlayCard(
    card: PlayingCard,
    playerId: PlayerId,
    currentPlayerId: PlayerId | null,
    opponentPositions: { playerId: PlayerId; position: string }[]
  ): Promise<void> {
    const sourceKey = resolvePlayerCoordKey(playerId, currentPlayerId, opponentPositions)
    if (!sourceKey) return Promise.resolve()

    const sourceRect = coords.getRect(sourceKey)
    const targetRect = coords.getRect('trick')
    if (!sourceRect || !targetRect) return Promise.resolve()

    const sourceCenter = { x: sourceRect.left + sourceRect.width / 2, y: sourceRect.top + sourceRect.height / 2 }
    const targetCenter = { x: targetRect.left + targetRect.width / 2, y: targetRect.top + targetRect.height / 2 }

    const animCard: AnimatedCard = {
      id: `play-${card.id}-${Date.now()}`,
      targetKey: 'trick',
      startX: sourceCenter.x,
      startY: sourceCenter.y,
      endX: targetCenter.x,
      endY: targetCenter.y,
      delay: 0,
      duration,
      spritePos: card.spritePos,
    }

    return new Promise((resolve) => {
      isAnimating.value = true
      flyingCards.value = [animCard]

      setTimeout(() => {
        flyingCards.value = []
        isAnimating.value = false
        resolve()
      }, duration + 100)
    })
  }

  /**
   * Animate trick cards flying from the trick area to the winner's hand.
   */
  function animateWinTrick(
    cards: PlayingCard[],
    winnerId: PlayerId,
    currentPlayerId: PlayerId | null,
    opponentPositions: { playerId: PlayerId; position: string }[]
  ): Promise<void> {
    const targetKey = resolvePlayerCoordKey(winnerId, currentPlayerId, opponentPositions)
    if (!targetKey) return Promise.resolve()

    const sourceRect = coords.getRect('trick')
    const targetRect = coords.getRect(targetKey)
    if (!sourceRect || !targetRect) return Promise.resolve()

    const sourceCenter = { x: sourceRect.left + sourceRect.width / 2, y: sourceRect.top + sourceRect.height / 2 }
    const targetCenter = { x: targetRect.left + targetRect.width / 2, y: targetRect.top + targetRect.height / 2 }

    const cardDelay = 80
    const animCards: AnimatedCard[] = cards.map((card, i) => ({
      id: `win-${card.id}-${Date.now()}`,
      targetKey,
      startX: sourceCenter.x,
      startY: sourceCenter.y,
      endX: targetCenter.x,
      endY: targetCenter.y,
      delay: i * cardDelay,
      duration,
      spritePos: card.spritePos,
    }))

    const totalTime = (cards.length - 1) * cardDelay + duration + 100

    return new Promise((resolve) => {
      isAnimating.value = true
      flyingCards.value = animCards

      setTimeout(() => {
        flyingCards.value = []
        isAnimating.value = false
        resolve()
      }, totalTime)
    })
  }

  return {
    flyingCards,
    isAnimating,
    animatePlayCard,
    animateWinTrick,
  }
}
