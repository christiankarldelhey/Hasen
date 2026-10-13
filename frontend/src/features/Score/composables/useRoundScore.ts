import { computed, type ComputedRef } from 'vue'
import type { PlayerId } from '@domain/interfaces/Player'
import type { Bid, PlayerBidEntry } from '@domain/interfaces/Bid'
import { getBidDuelAdjustment, getCollectionNetScore, getPlayerBidOutcome, getPlayerScoreFromRound } from '@domain/rules/BidRules'
import { useGameStore } from '@/stores/gameStore'

export interface RoundBidResult {
  bid: Bid
  bidEntry: PlayerBidEntry
  isWinning: boolean | null
  score: number
  duelScore: number
  setCollectionData?: {
    winSuitCount: number
    otherSuitCount: number
    penaltyPerCard: number
    netScore: number
    floor: number
  }
}

export interface RoundPlayerResult {
  playerId: PlayerId
  playerName: string
  playerColor: string
  roundScore: number          // Score final del round
  totalScore: number          // Score acumulado del juego
  previousScore: number       // Score antes de este round
  bids: RoundBidResult[]     // Array vacío si no tiene bids
  hasBids: boolean           // Flag para fácil condicional
  cardPoints: number         // Points de cartas (fallback)
}

export interface UseRoundScoreReturn {
  playersResults: ComputedRef<RoundPlayerResult[]>
  isLoading: ComputedRef<boolean>
}

/**
 * Composable para calcular y gestionar los resultados del round
 * Centraliza la lógica de cálculo de scores considerando bids y card points
 */
export function useRoundScore(): UseRoundScoreReturn {
  const gameStore = useGameStore()

  /**
   * Calcula el resultado de un bid específico para un jugador
   */
  const calculateBidResult = (
    bid: Bid,
    bidEntry: PlayerBidEntry,
    playerRoundScore: import('@domain/interfaces/Round').PlayerRoundScore,
    playerId: PlayerId
  ): RoundBidResult | null => {
    const outcome = getPlayerBidOutcome(bid, bidEntry, playerRoundScore)
    const duelScore = getBidDuelAdjustment(
      gameStore.publicGameState as unknown as import('@domain/interfaces/Game').Game,
      playerId,
      bidEntry,
      outcome.isWinning
    )
    let setCollectionData: RoundBidResult['setCollectionData'] = undefined

    if (bid.bid_type === 'set_collection') {
      const condition = bid.win_condition as import('@domain/interfaces/Bid').SetCollectionBidCondition
      const winSuitCount = playerRoundScore.setCollection[condition.win_suit] || 0
      const otherSuitCount = Object.entries(playerRoundScore.setCollection)
        .reduce((total, [suit, count]) => total + (suit === condition.win_suit ? 0 : count), 0)
      const netScore = getCollectionNetScore(bid, playerRoundScore, bidEntry)

      setCollectionData = {
        winSuitCount,
        otherSuitCount,
        penaltyPerCard: bidEntry.trickNumber * 2,
        netScore,
        floor: condition.floor
      }
    }

    return {
      bid,
      bidEntry,
      isWinning: outcome.isWinning,
      score: outcome.score,
      duelScore,
      setCollectionData
    }
  }

  /**
   * Resultados de todos los jugadores para el round actual
   */
  const playersResults = computed<RoundPlayerResult[]>(() => {
    if (!gameStore.publicGameState?.round) return []

    const round = gameStore.publicGameState.round
    const playerScores = gameStore.publicGameState.playerScores || []
    const activePlayers = gameStore.publicGameState.activePlayers || []

    return activePlayers.map(player => {
      const playerId = player.id
      
      const playerBidEntries = round.roundBids.playerBids[playerId] || []
      const playerRoundScore = round.roundScore.find(s => s.playerId === playerId)
      
      // ✅ Usar directamente el valor del backend (ya incluye el round actual)
      const totalScore = playerScores.find(s => s.playerId === playerId)?.score || 0
      
      if (!playerRoundScore) {
        return {
          playerId: playerId,
          playerName: player.name,
          playerColor: player.color,
          roundScore: 0,
          totalScore,
          previousScore: totalScore,
          bids: [],
          hasBids: false,
          cardPoints: 0
        }
      }

      const bidResults: RoundBidResult[] = []
      
      playerBidEntries.forEach(bidEntry => {
        const bid = round.roundBids.bids.find(b => b.bid_id === bidEntry.bidId)
        if (bid) {
          const result = calculateBidResult(bid, bidEntry, playerRoundScore, playerId)
          if (result) {
            bidResults.push(result)
          }
        }
      })

      let roundScore: number
      let cardPoints: number

      if (bidResults.length === 0) {
        roundScore = playerRoundScore.points
        cardPoints = playerRoundScore.points
      } else {
        roundScore = getPlayerScoreFromRound(gameStore.publicGameState as unknown as import('@domain/interfaces/Game').Game, playerId)
        cardPoints = playerRoundScore.points
      }

      const playerResult = {
        playerId: playerId,
        playerName: player.name,
        playerColor: player.color,
        roundScore,
        totalScore,
        previousScore: totalScore - roundScore,
        bids: bidResults,
        hasBids: bidResults.length > 0,
        cardPoints
      }

      return playerResult
    }).filter(player => player !== null).sort((a, b) => b.roundScore - a.roundScore)
  })

  /**
   * Indica si los datos están cargando
   */
  const isLoading = computed(() => {
    return !gameStore.publicGameState?.round
  })

  return {
    playersResults,
    isLoading
  }
}
