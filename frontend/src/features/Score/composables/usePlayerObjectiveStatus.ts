import { computed, type Ref, type ComputedRef } from 'vue'
import type { PlayerId } from '@domain/interfaces/Player'
import { isWinningBid } from '@domain/rules/BidRules'
import { useGameStore } from '@/stores/gameStore'

export type ObjectiveStatus = 'none' | 'pending' | 'winning' | 'losing'

/**
 * Estado agregado de las apuestas activas de un jugador:
 * - 'none':    no apostó → blanco
 * - 'winning': todas las apuestas se están cumpliendo → verde
 * - 'losing':  alguna ya es imposible/perdida → rojo
 * - 'pending': mezcla o aún indeterminado → blanco
 */
export function usePlayerObjectiveStatus(
  playerId: Ref<PlayerId | null> | ComputedRef<PlayerId | null>
) {
  const gameStore = useGameStore()

  const playerRoundScore = computed(() =>
    gameStore.publicGameState?.round.roundScore.find(
      (s) => s.playerId === playerId.value
    ) ?? null
  )

  const points = computed(() => playerRoundScore.value?.points ?? 0)

  const status = computed<ObjectiveStatus>(() => {
    const id = playerId.value
    const score = playerRoundScore.value
    if (!id || !score) return 'none'

    const entries = gameStore.publicGameState?.round.roundBids.playerBids?.[id] ?? []
    if (entries.length === 0) return 'none'

    const bids = gameStore.publicGameState?.round.roundBids.bids ?? []
    const isRoundComplete =
      gameStore.publicGameState?.round.roundPhase === 'scoring'

    const results = entries.map((entry) => {
      const bid = bids.find((b) => b.bid_id === entry.bidId)
      if (!bid) return null
      return isWinningBid(bid, score, isRoundComplete)
    })

    if (results.some((r) => r === false)) return 'losing'
    if (results.length > 0 && results.every((r) => r === true)) return 'winning'
    return 'pending'
  })

  return { points, status }
}
