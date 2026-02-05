import { computed, type ComputedRef } from 'vue'
import type { PlayerId } from '@domain/interfaces/Player'
import type { SetCollectionBidCondition } from '@domain/interfaces/Bid'
import { useGameStore } from '@/stores/gameStore'

export interface UseGameScoreReturn {
  playerScore: ComputedRef<number>
  playerRoundPoints: ComputedRef<number>
  allPlayerScores: ComputedRef<Array<{ playerId: PlayerId; score: number }>>
  isRoundComplete: ComputedRef<boolean>
  playerSetCollectionScore: ComputedRef<number>
  hasSetCollectionBid: ComputedRef<boolean>
  playerRoundScore: ComputedRef<any>
}

/**
 * Composable para gestionar los scores del juego
 * @param playerId - ID del jugador para el que queremos obtener el score
 * @returns Objeto con scores y estado del round
 */
export function useGameScore(playerId: PlayerId): UseGameScoreReturn {
  const gameStore = useGameStore()

  /**
   * Score acumulado del jugador en el juego (suma de todos los rounds)
   */
  const playerScore = computed(() => {
    const playerScores = gameStore.publicGameState?.playerScores || []
    const found = playerScores.find((score) => score.playerId === playerId)
    return found?.score ?? 0
  })

  /**
   * Points del jugador en el round actual (temporal, se resetea cada round)
   */
  const playerRoundPoints = computed(() => {
    const roundScore = gameStore.publicGameState?.round.roundScore || []
    const found = roundScore.find((score) => score.playerId === playerId)
    return found?.points ?? 0
  })

  /**
   * Round score completo del jugador (incluye points, tricksWon, setCollection)
   */
  const playerRoundScore = computed(() => {
    const roundScore = gameStore.publicGameState?.round.roundScore || []
    return roundScore.find((score) => score.playerId === playerId)
  })

  /**
   * Todos los scores acumulados de todos los jugadores
   */
  const allPlayerScores = computed(() => {
    return gameStore.publicGameState?.playerScores || []
  })

  /**
   * Indica si el round está completo (fase scoring)
   */
  const isRoundComplete = computed(() => {
    return gameStore.publicGameState?.round.roundPhase === 'scoring'
  })

  /**
   * Indica si el jugador tiene un bid de set collection activo
   */
  const hasSetCollectionBid = computed(() => {
    const playerBids = gameStore.publicGameState?.round.roundBids.playerBids?.[playerId] || []
    const allBids = gameStore.publicGameState?.round.roundBids.bids || []
    
    return playerBids.some(entry => {
      const bid = allBids.find(b => b.bid_id === entry.bidId)
      return bid?.bid_type === 'set_collection'
    })
  })

  /**
   * Score calculado del set collection (winScore + avoidScore)
   */
  const playerSetCollectionScore = computed(() => {
    if (!hasSetCollectionBid.value || !playerRoundScore.value) return 0

    const playerBids = gameStore.publicGameState?.round.roundBids.playerBids?.[playerId] || []
    const allBids = gameStore.publicGameState?.round.roundBids.bids || []
    
    const setBidEntry = playerBids.find(entry => {
      const bid = allBids.find(b => b.bid_id === entry.bidId)
      return bid?.bid_type === 'set_collection'
    })
    
    if (!setBidEntry) return 0
    
    const bid = allBids.find(b => b.bid_id === setBidEntry.bidId)
    if (!bid) return 0
    
    const condition = bid.win_condition as SetCollectionBidCondition
    const setCollection = playerRoundScore.value.setCollection
    
    const winCount = setCollection[condition.win_suit] || 0
    const avoidCount = setCollection[condition.avoid_suit] || 0
    
    const winScore = winCount * bid.bid_score
    const avoidScore = avoidCount * setBidEntry.onLose
    
    return winScore + avoidScore
  })

  return {
    playerScore,
    playerRoundPoints,
    allPlayerScores,
    isRoundComplete,
    playerSetCollectionScore,
    hasSetCollectionBid,
    playerRoundScore
  }
}
