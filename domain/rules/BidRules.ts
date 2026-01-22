import type { Game } from '../interfaces/Game'
import type { PlayerId } from '../interfaces/Player'
import type { BidType } from '../interfaces/Bid'
import type { TrickNumber } from '../interfaces/Trick'

export interface CanMakeBidResult {
  canMakeBid: boolean
  reason?: string
}

export function canMakeBid(
  game: Game,
  playerId: PlayerId,
  bidType: BidType,
  trickNumber: TrickNumber
): CanMakeBidResult {
  if (game.round.playerTurn !== playerId) {
    return {
      canMakeBid: false,
      reason: 'No es tu turno'
    }
  }

  if (trickNumber > 3) {
    return {
      canMakeBid: false,
      reason: 'Solo puedes hacer bids en los primeros 3 tricks'
    }
  }

  if (!game.round.currentTrick || game.round.currentTrick.trick_state !== 'in_progress') {
    return {
      canMakeBid: false,
      reason: 'El trick debe estar en progreso para hacer un bid'
    }
  }

  const availableBids = game.round.roundBids.bids.filter(b => b.bid_type === bidType)
  
  if (availableBids.length === 0) {
    return {
      canMakeBid: false,
      reason: 'No hay bid disponible de este tipo'
    }
  }

  const playerBids = game.round.roundBids.playerBids[playerId] || []
  
  // Rule: Solo un bid por turno (por trick)
  const hasBidInCurrentTrick = playerBids.some(pb => pb.trickNumber === trickNumber)
  if (hasBidInCurrentTrick) {
    return {
      canMakeBid: false,
      reason: 'Solo puedes hacer un bid por turno'
    }
  }

  // Rule: No se pueden hacer dos bids del mismo tipo en una ronda
  const hasBidTypeInRound = playerBids.some(pb => {
    const bid = game.round.roundBids.bids.find(b => b.bid_id === pb.bidId)
    return bid?.bid_type === bidType
  })
  
  if (hasBidTypeInRound) {
    return {
      canMakeBid: false,
      reason: 'Ya tienes un bid de este tipo en esta ronda'
    }
  }

  // Rule: Máximo 3 bids por ronda
  if (playerBids.length >= 3) {
    return {
      canMakeBid: false,
      reason: 'Ya tienes el máximo de 3 bids en esta ronda'
    }
  }

  // Rule: Máximo 2 jugadores por bid específico
  const allBidsFull = availableBids.every(bid => {
    const biddersCount = Object.values(game.round.roundBids.playerBids)
      .flat()
      .filter(pb => pb.bidId === bid.bid_id)
      .length
    return biddersCount >= 2
  })
  
  if (allBidsFull) {
    return {
      canMakeBid: false,
      reason: 'Todos los bids de este tipo ya tienen el máximo de 2 jugadores'
    }
  }

  // Rule: Verificar si la apuesta ya está perdida de antemano
  const playerRoundScore = game.round.roundScore.find(score => score.playerId === playerId)
  if (playerRoundScore) {
    // Para trick bids: verificar condiciones de tricks
    if (bidType === 'trick') {
      for (const bid of availableBids) {
        const condition = bid.win_condition as import('../interfaces/Bid').TrickBidCondition
        
        // Verificar win_trick_position: si debíamos ganar un trick específico y ya lo perdimos
        if (condition.win_trick_position) {
          const lostRequiredTrick = condition.win_trick_position.some(
            requiredTrick => requiredTrick < trickNumber && !playerRoundScore.tricksWon.includes(requiredTrick)
          )
          if (lostRequiredTrick) {
            return {
              canMakeBid: false,
              reason: 'Ya perdiste un trick que debías ganar'
            }
          }
        }
        
        // Verificar lose_trick_position: si debíamos perder un trick específico y ya lo ganamos
        if (condition.lose_trick_position) {
          const wonForbiddenTrick = condition.lose_trick_position.some(
            forbiddenTrick => playerRoundScore.tricksWon.includes(forbiddenTrick)
          )
          if (wonForbiddenTrick) {
            return {
              canMakeBid: false,
              reason: 'Ya ganaste un trick que debías perder'
            }
          }
        }
        
        // Verificar win_min_tricks: si ya es imposible alcanzar el mínimo
        if (condition.win_min_tricks) {
          const tricksWonSoFar = playerRoundScore.tricksWon.length
          const tricksRemaining = 6 - (game.round.currentTrick?.trick_number || 1) + 1
          const maxPossibleTricks = tricksWonSoFar + tricksRemaining
          
          if (maxPossibleTricks < condition.win_min_tricks) {
            return {
              canMakeBid: false,
              reason: 'Ya no puedes alcanzar el mínimo de tricks requeridos'
            }
          }
        }
        
        // Verificar win_max_tricks: si ya superamos el máximo
        if (condition.win_max_tricks !== undefined) {
          const tricksWonSoFar = playerRoundScore.tricksWon.length
          
          if (tricksWonSoFar > condition.win_max_tricks) {
            return {
              canMakeBid: false,
              reason: 'Ya superaste el máximo de tricks permitidos'
            }
          }
        }
      }
    }
    
    // Para points bids: verificar si ya superamos el max_points
    if (bidType === 'points') {
      for (const bid of availableBids) {
        const condition = bid.win_condition as import('../interfaces/Bid').PointsBidCondition
        
        if (playerRoundScore.points > condition.max_points) {
          return {
            canMakeBid: false,
            reason: 'Ya superaste el máximo de puntos permitidos'
          }
        }
      }
    }
    
    // Para set_collection: no hay validaciones (siempre hay posibilidad de revertir)
  }

  return {
    canMakeBid: true
  }
}

/**
 * Calcula la penalización (onLose) por fallar un bid según las reglas del juego
 * 
 * Reglas:
 * - set_collection: -10 (trick 1), -15 (trick 2), -20 (trick 3)
 * - trick/points: -20 (trick 1), -25 (trick 2), -30 (trick 3)
 */
export function calculateBidOnLose(
  bidType: BidType,
  trickNumber: TrickNumber
): number {
  if (bidType === 'set_collection') {
    if (trickNumber === 1) return -10
    if (trickNumber === 2) return -15
    if (trickNumber === 3) return -20
  }
  
  if (bidType === 'trick' || bidType === 'points') {
    if (trickNumber === 1) return -20
    if (trickNumber === 2) return -25
    if (trickNumber === 3) return -30
  }
  
  return 0
}
