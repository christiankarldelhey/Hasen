import { computed, type ComputedRef } from 'vue'
import type { PlayerId } from '@domain/interfaces/Player'
import type { BidType, Bid } from '@domain/interfaces/Bid'
import type { Round } from '@domain/interfaces/Round'
import { canMakeSpecificBid } from '@domain/rules/BidRules'

interface GameState {
  round: Round
}

export function useBidValidation(
  game: ComputedRef<GameState | null>,
  playerId: ComputedRef<PlayerId | null>
) {
  const canMakeBidType = (_bidType: BidType, bid: Bid) => {
    if (!game.value || !playerId.value) {
      return { canMakeBid: false, reason: 'Game or player not found' }
    }

    const currentTrick = game.value.round.currentTrick
    if (!currentTrick) {
      return { canMakeBid: false, reason: 'No current trick' }
    }

    const trickNumber = currentTrick.trick_number
    
    // Use canMakeSpecificBid to validate each bid individually
    return canMakeSpecificBid(game.value as any, playerId.value, bid, trickNumber)
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
