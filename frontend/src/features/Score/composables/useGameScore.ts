import { computed, type ComputedRef } from 'vue'
import type { PlayerId } from '@domain/interfaces/Player'
import { useGameStore } from '@/stores/gameStore'

export interface UseGameScoreReturn {
  playerScore: ComputedRef<number>
  playerRoundPoints: ComputedRef<number>
  allPlayerScores: ComputedRef<Array<{ playerId: PlayerId; score: number }>>
  isRoundComplete: ComputedRef<boolean>
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

  return {
    playerScore,
    playerRoundPoints,
    allPlayerScores,
    isRoundComplete
  }
}
