import type { Bid, PointsBidCondition, SetCollectionBidCondition, TrickBidCondition } from '@domain/interfaces/Bid'
import type { Suit } from '@domain/interfaces/Card'
import { useI18n } from './useI18n'
import { POINTS_BID_OPEN_MAX } from '@domain/data/bidDefinitions'

export type TooltipType = 'info' | 'error'

export interface BidTooltip {
  text: string
  type: TooltipType
  subtitle?: string
}

const suitNames: Record<Suit, string> = {
  acorns: 'suits.acorns',
  leaves: 'suits.leaves',
  berries: 'suits.berries',
  flowers: 'suits.flowers'
}

function formatTrickPositions(positions: number[]): string {
  if (positions.length === 1) return `${positions[0]}`
  if (positions.length === 2) return `${positions[0]} and ${positions[1]}`
  if (positions.length === 5) return 'all'
  
  const last = positions[positions.length - 1]
  const rest = positions.slice(0, -1).join(', ')
  return `${rest}, and ${last}`
}

function getPointsBidDescription(condition: PointsBidCondition, t: (key: string, params?: Record<string, string | number>) => string): string {
  const { min_points, max_points } = condition
  
  if (max_points >= POINTS_BID_OPEN_MAX) {
    return t('bids.scorePoints', { min: min_points })
  }

  if (min_points === max_points) {
    return t('bids.scoreExactly', { points: min_points })
  }
  
  return t('bids.scoreRange', { min: min_points, max: max_points })
}

function getSetCollectionBidDescription(
  bid: Bid,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  const condition = bid.win_condition as SetCollectionBidCondition
  const winSuit = t(suitNames[condition.win_suit])

  return t('bids.collectFloor', {
    win: winSuit,
    value: bid.bid_score,
    floor: condition.floor
  })
}

function getTrickBidDescription(
  condition: TrickBidCondition,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  if (condition.win_trick_position && condition.lose_trick_position) {
    const winPositions = formatTrickPositions(condition.win_trick_position)
    const losePositions = formatTrickPositions(condition.lose_trick_position)
    return t('bids.winAndLose', { win: winPositions === 'all' ? t('bids.allTricks') : winPositions, lose: losePositions === 'all' ? t('bids.allTricks') : losePositions })
  }
  
  if (condition.win_trick_position && condition.may_win_trick_position) {
    return t('bids.winWithFree', {
      win: formatTrickPositions(condition.win_trick_position),
      free: formatTrickPositions(condition.may_win_trick_position)
    })
  }
  
  if (condition.win_trick_position) {
    const positions = formatTrickPositions(condition.win_trick_position)
    if (positions === 'all') return t('bids.winOnly', { numbers: t('bids.allTricks') })
    if (condition.win_trick_position.length === 1) {
      return t('bids.winTrick', { number: condition.win_trick_position[0] ?? 0 })
    }
    return t('bids.winTricks', { numbers: positions })
  }
  
  if (condition.win_min_tricks !== undefined && condition.win_max_tricks !== undefined) {
    const { win_min_tricks, win_max_tricks } = condition
    
    if (win_min_tricks === win_max_tricks) {
      return win_min_tricks === 1
        ? t('bids.winExactlyOne')
        : t('bids.winExactly', { count: win_min_tricks })
    }
    
    return t('bids.winRange', { min: win_min_tricks, max: win_max_tricks })
  }
  
  return t('bids.unknownTrickCondition')
}

export function useBidTooltips() {
  const { t } = useI18n()

  const getBidDescription = (bid: Bid): string => {
    switch (bid.bid_type) {
      case 'points':
        return getPointsBidDescription(bid.win_condition as PointsBidCondition, t)
      case 'set_collection':
        return getSetCollectionBidDescription(bid, t)
      case 'trick':
        return getTrickBidDescription(bid.win_condition as TrickBidCondition, t)
      default:
        return t('bids.unknownBidType')
    }
  }

  const errorMessages = {
    alreadyMadeBid: t('errors.alreadyMadeBid'),
    notYourTurn: t('errors.notYourTurn'),
    noCurrentTrick: t('errors.noActiveTrick'),
    gameNotFound: t('errors.gameNotFound'),
    maxBidsReached: t('errors.maxBidsReached'),
    bidAlreadyTaken: t('errors.bidAlreadyTaken'),
    cannotBidAfterPlaying: t('errors.cannotBidAfterPlaying'),
    bidNoLongerPossible: t('errors.bidNoLongerPossible')
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
    } else if (reason.includes('no longer possible')) {
      errorText = errorMessages.bidNoLongerPossible
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
      const infoTooltip = getInfoTooltip(bid)
      const errorTooltip = getErrorTooltip(disabledReason)

      if (!errorTooltip) return infoTooltip

      return {
        text: errorTooltip.text,
        subtitle: `(${infoTooltip.text})`,
        type: 'error'
      }
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
