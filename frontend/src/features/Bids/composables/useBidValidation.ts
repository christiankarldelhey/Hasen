import { computed, type ComputedRef } from 'vue'
import type { PlayerId } from '@domain/interfaces/Player'
import type { BidType, Bid } from '@domain/interfaces/Bid'
import type { Round } from '@domain/interfaces/Round'
import { canMakeBid } from '@domain/rules/BidRules'

interface GameState {
  round: Round
}

export function useBidValidation(
  game: ComputedRef<GameState | null>,
  playerId: ComputedRef<PlayerId | null>
) {
  const canMakeBidType = (bidType: BidType, _bid: Bid) => {
    if (!game.value || !playerId.value) {
      return { canMakeBid: false, reason: 'Game or player not found' }
    }

    const currentTrick = game.value.round.currentTrick
    if (!currentTrick) {
      return { canMakeBid: false, reason: 'No current trick' }
    }

    const trickNumber = currentTrick.trick_number
    
    // Cast to Game type for canMakeBid - it only needs the round property
    return canMakeBid(game.value as any, playerId.value, bidType, trickNumber)
  }

  const isBidDisabled = computed(() => {
    return (bidType: BidType, bid: Bid): boolean => {
      const validation = canMakeBidType(bidType, bid)
      return !validation.canMakeBid
    }
  })

  const getBidDisabledReason = computed(() => {
    return (bidType: BidType, bid: Bid): string | undefined => {
      const validation = canMakeBidType(bidType, bid)
      return validation.reason
    }
  })

  return {
    canMakeBidType,
    isBidDisabled,
    getBidDisabledReason
  }
}
