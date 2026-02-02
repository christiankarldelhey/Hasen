import type { Bid, PointsBidCondition, SetCollectionBidCondition, TrickBidCondition } from '@domain/interfaces/Bid'
import type { Suit } from '@domain/interfaces/Card'

export type TooltipType = 'info' | 'error'

export interface BidTooltip {
  text: string
  type: TooltipType
}

const suitNames: Record<Suit, string> = {
  acorns: 'Acorns',
  leaves: 'Leaves',
  berries: 'Berries',
  flowers: 'Flowers'
}

function formatTrickPositions(positions: number[]): string {
  if (positions.length === 1) return `trick ${positions[0]}`
  if (positions.length === 2) return `tricks ${positions[0]} and ${positions[1]}`
  if (positions.length === 5) return 'all tricks'
  
  const last = positions[positions.length - 1]
  const rest = positions.slice(0, -1).join(', ')
  return `tricks ${rest}, and ${last}`
}

function getPointsBidDescription(condition: PointsBidCondition): string {
  const { min_points, max_points } = condition
  
  if (max_points >= 100) {
    return `Score ${min_points}+ points`
  }
  
  if (min_points === max_points) {
    return `Score exactly ${min_points} points`
  }
  
  return `Score ${min_points}-${max_points} points`
}

function getSetCollectionBidDescription(condition: SetCollectionBidCondition): string {
  const winSuit = suitNames[condition.win_suit]
  const avoidSuit = suitNames[condition.avoid_suit]
  
  return `Collect ${winSuit}, avoid ${avoidSuit}`
}

function getTrickBidDescription(condition: TrickBidCondition): string {
  if (condition.win_trick_position && condition.lose_trick_position) {
    const winPositions = formatTrickPositions(condition.win_trick_position)
    const losePositions = formatTrickPositions(condition.lose_trick_position)
    return `Win ${winPositions}, lose ${losePositions}`
  }
  
  if (condition.win_trick_position && condition.may_win_trick_position) {
    const winPositions = formatTrickPositions(condition.win_trick_position)
    return `Win only ${winPositions}`
  }
  
  if (condition.win_trick_position) {
    const positions = formatTrickPositions(condition.win_trick_position)
    return `Win ${positions}`
  }
  
  if (condition.win_min_tricks !== undefined && condition.win_max_tricks !== undefined) {
    const { win_min_tricks, win_max_tricks } = condition
    
    if (win_min_tricks === win_max_tricks) {
      return win_min_tricks === 1 
        ? 'Win exactly 1 trick' 
        : `Win exactly ${win_min_tricks} tricks`
    }
    
    return `Win ${win_min_tricks}-${win_max_tricks} tricks`
  }
  
  return 'Unknown trick condition'
}

export function useBidTooltips() {
  const getBidDescription = (bid: Bid): string => {
    switch (bid.bid_type) {
      case 'points':
        return getPointsBidDescription(bid.win_condition as PointsBidCondition)
      case 'set_collection':
        return getSetCollectionBidDescription(bid.win_condition as SetCollectionBidCondition)
      case 'trick':
        return getTrickBidDescription(bid.win_condition as TrickBidCondition)
      default:
        return 'Unknown bid type'
    }
  }

  const errorMessages = {
    alreadyMadeBid: 'Already made a bid this trick',
    notYourTurn: 'Not your turn',
    noCurrentTrick: 'No active trick',
    gameNotFound: 'Game or player not found',
    maxBidsReached: 'Maximum bids reached for this trick',
    bidAlreadyTaken: 'This bid is already taken by another player',
    cannotBidAfterPlaying: 'Cannot bid after playing a card'
  }

  const getErrorTooltip = (reason?: string): BidTooltip | null => {
    if (!reason) return null

    let errorText = reason

    if (reason.includes('already made a bid')) {
      errorText = errorMessages.alreadyMadeBid
    } else if (reason.includes('not your turn') || reason.includes('Not your turn')) {
      errorText = errorMessages.notYourTurn
    } else if (reason.includes('No current trick')) {
      errorText = errorMessages.noCurrentTrick
    } else if (reason.includes('Game or player not found')) {
      errorText = errorMessages.gameNotFound
    } else if (reason.includes('maximum')) {
      errorText = errorMessages.maxBidsReached
    } else if (reason.includes('already taken')) {
      errorText = errorMessages.bidAlreadyTaken
    } else if (reason.includes('after playing')) {
      errorText = errorMessages.cannotBidAfterPlaying
    }

    return {
      text: errorText,
      type: 'error'
    }
  }

  const getInfoTooltip = (bid: Bid): BidTooltip => {
    return {
      text: getBidDescription(bid),
      type: 'info'
    }
  }

  const getTooltip = (bid: Bid, disabled: boolean, disabledReason?: string): BidTooltip => {
    if (disabled && disabledReason) {
      return getErrorTooltip(disabledReason) || getInfoTooltip(bid)
    }
    return getInfoTooltip(bid)
  }

  return {
    getBidDescription,
    getErrorTooltip,
    getInfoTooltip,
    getTooltip,
    errorMessages
  }
}
