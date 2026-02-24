import { computed, type ComputedRef } from 'vue'
import { AVAILABLE_PLAYERS, type PlayerId } from '@domain/interfaces/Player'
import type { Bid, PlayerBidEntry } from '@domain/interfaces/Bid'
import { isWinningBid } from '@domain/rules/BidRules'
import { useGameStore } from '@/stores/gameStore'

export interface RoundBidResult {
  bid: Bid
  bidEntry: PlayerBidEntry
  isWinning: boolean | null
  score: number
  setCollectionData?: {
    winSuitCount: number
    avoidSuitCount: number
    penaltyPerCard: number
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
    playerRoundScore: import('@domain/interfaces/Round').PlayerRoundScore
  ): RoundBidResult | null => {
    const isWinning = isWinningBid(bid, playerRoundScore, true)
    let score = 0
    let setCollectionData: RoundBidResult['setCollectionData'] = undefined

    if (isWinning === true) {
      if (bid.bid_type === 'set_collection') {
        const condition = bid.win_condition as import('@domain/interfaces/Bid').SetCollectionBidCondition
        const winSuitCount = playerRoundScore.setCollection[condition.win_suit]
        const avoidSuitCount = playerRoundScore.setCollection[condition.avoid_suit]
        const penaltyPerCard = Math.abs(bidEntry.onLose)
        score = (winSuitCount * 10) - (avoidSuitCount * penaltyPerCard)
        setCollectionData = { winSuitCount, avoidSuitCount, penaltyPerCard }
      } else {
        score = bid.bid_score
      }
    } else if (isWinning === false) {
      if (bid.bid_type === 'set_collection') {
        const condition = bid.win_condition as import('@domain/interfaces/Bid').SetCollectionBidCondition
        const winSuitCount = playerRoundScore.setCollection[condition.win_suit]
        const avoidSuitCount = playerRoundScore.setCollection[condition.avoid_suit]
        const penaltyPerCard = Math.abs(bidEntry.onLose)
        const netPoints = (winSuitCount * 10) - (avoidSuitCount * penaltyPerCard)
        setCollectionData = { winSuitCount, avoidSuitCount, penaltyPerCard }
        
        if (netPoints >= -9 && netPoints <= 9) {
          score = -10
        } else {
          score = netPoints
        }
      } else {
        score = bidEntry.onLose
      }
    }

    return {
      bid,
      bidEntry,
      isWinning,
      score,
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

    return activePlayers.map(playerId => {
      const player = AVAILABLE_PLAYERS.find(p => p.id === playerId)
      if (!player) return null
      
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
          const result = calculateBidResult(bid, bidEntry, playerRoundScore)
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
        roundScore = bidResults.reduce((sum, bid) => sum + bid.score, 0)
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
