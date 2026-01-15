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

  const bidKey = bidType === 'points' ? 'points' : bidType === 'set_collection' ? 'set_collection' : 'trick'
  const currentBid = game.round.roundBids[bidKey]
  
  if (!currentBid) {
    return {
      canMakeBid: false,
      reason: 'No hay bid disponible de este tipo'
    }
  }

  const trickKey = `trick_${trickNumber}` as 'trick_1' | 'trick_2' | 'trick_3'
  const playerBid = currentBid.current_bids[trickKey]
  
  if (playerBid && playerBid.bidder === playerId) {
    return {
      canMakeBid: false,
      reason: 'Ya tienes un bid de este tipo en este trick'
    }
  }

  return {
    canMakeBid: true
  }
}
