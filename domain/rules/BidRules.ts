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
  const hasBidInTrick = playerBids.some(
    pb => pb.trickNumber === trickNumber && 
          availableBids.some(ab => ab.bid_id === pb.bidId && ab.bid_type === bidType)
  )
  
  if (hasBidInTrick) {
    return {
      canMakeBid: false,
      reason: 'Ya tienes un bid de este tipo en este trick'
    }
  }

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
