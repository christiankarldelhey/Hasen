import { computed, type ComputedRef } from 'vue'
import type { TrickNumber } from '@domain/interfaces/Trick'
import type { PlayerBidEntry, Bid, TrickBidCondition, SetCollectionBidCondition, PointsBidCondition } from '@domain/interfaces/Bid'
import type { Suit } from '@domain/interfaces/Card'

export interface TrickDisplayInfo {
  trickNumber: TrickNumber
  state: 'win' | 'lose' | 'neutral' | 'blank'
  opacity: number
}

export interface SetCollectionDisplay {
  winSuit: Suit
  avoidSuit: Suit
  winScore: number
  avoidScore: number
}

export interface PointsDisplay {
  minPoints: number
  maxPoints: number
}

export function usePlayerScore(
  playerBids: ComputedRef<PlayerBidEntry[]>,
  tricksWon: ComputedRef<TrickNumber[]>,
  currentTrick: ComputedRef<number>,
  allBids: ComputedRef<Bid[]>,
  setCollection?: ComputedRef<Record<Suit, number>>
) {
  const trickBid = computed(() => {
    const trickBidEntry = playerBids.value.find(entry => {
      const bid = allBids.value.find(b => b.bid_id === entry.bidId)
      return bid?.bid_type === 'trick'
    })
    
    if (!trickBidEntry) return null
    
    const bid = allBids.value.find(b => b.bid_id === trickBidEntry.bidId)
    return bid ? { ...bid, win_condition: bid.win_condition as TrickBidCondition } : null
  })

  const setCollectionBid = computed(() => {
    const setBidEntry = playerBids.value.find(entry => {
      const bid = allBids.value.find(b => b.bid_id === entry.bidId)
      return bid?.bid_type === 'set_collection'
    })
    
    if (!setBidEntry) return null
    
    const bid = allBids.value.find(b => b.bid_id === setBidEntry.bidId)
    if (!bid) return null
    
    return {
      bid,
      entry: setBidEntry,
      condition: bid.win_condition as SetCollectionBidCondition
    }
  })

  const pointsBid = computed(() => {
    const pointsBidEntry = playerBids.value.find(entry => {
      const bid = allBids.value.find(b => b.bid_id === entry.bidId)
      return bid?.bid_type === 'points'
    })
    
    if (!pointsBidEntry) return null
    
    const bid = allBids.value.find(b => b.bid_id === pointsBidEntry.bidId)
    if (!bid) return null
    
    return {
      bid,
      entry: pointsBidEntry,
      condition: bid.win_condition as PointsBidCondition
    }
  })

  const setCollectionDisplay = computed((): SetCollectionDisplay | null => {
    if (!setCollectionBid.value || !setCollection) return null
    
    const { bid, entry, condition } = setCollectionBid.value
    const winSuit = condition.win_suit
    const avoidSuit = condition.avoid_suit
    const winCount = setCollection.value[winSuit] || 0
    const avoidCount = setCollection.value[avoidSuit] || 0
    
    return {
      winSuit,
      avoidSuit,
      winScore: winCount * bid.bid_score,
      avoidScore: avoidCount * entry.onLose
    }
  })

  const pointsDisplay = computed((): PointsDisplay | null => {
    if (!pointsBid.value) return null
    
    const { condition } = pointsBid.value
    
    return {
      minPoints: condition.min_points,
      maxPoints: condition.max_points
    }
  })

  const isBidLost = computed(() => {
    if (!trickBid.value) return false
    
    const condition = trickBid.value.win_condition
    const tricksWonCount = tricksWon.value.length
    const tricksPlayed = Math.max(0, currentTrick.value - 1)
    const tricksRemaining = 5 - tricksPlayed

    if (condition.win_min_tricks !== undefined && condition.win_max_tricks !== undefined) {
      if (tricksWonCount > condition.win_max_tricks) return true
      if (tricksWonCount + tricksRemaining < condition.win_min_tricks) return true
    }

    if (condition.win_trick_position) {
      for (const pos of condition.win_trick_position) {
        if (pos < currentTrick.value && !tricksWon.value.includes(pos)) {
          return true
        }
      }
    }

    if (condition.lose_trick_position) {
      for (const pos of condition.lose_trick_position) {
        if (pos < currentTrick.value && tricksWon.value.includes(pos)) {
          return true
        }
      }
    }

    return false
  })

  const trickDisplays = computed((): TrickDisplayInfo[] => {
    const trickNumbers: TrickNumber[] = [1, 2, 3, 4, 5]
    const tricksWonCount = tricksWon.value.length

    return trickNumbers.map(num => {
      const isPast = num < currentTrick.value
      const opacity = num >= currentTrick.value ? 0.7 : 1

      // Always show win/lose for past tricks
      if (isPast) {
        const won = tricksWon.value.includes(num)
        return {
          trickNumber: num,
          state: won ? 'win' : 'lose',
          opacity
        }
      }

      // If no trick bid, show blank for future tricks
      if (!trickBid.value) {
        return {
          trickNumber: num,
          state: 'blank' as const,
          opacity
        }
      }

      // For future tricks with a bid, show prediction
      const condition = trickBid.value.win_condition

      if (condition.win_min_tricks !== undefined && condition.win_max_tricks !== undefined) {
        const futureCount = 5 - num + 1
        
        if (tricksWonCount >= condition.win_max_tricks) {
          return { trickNumber: num, state: 'lose', opacity }
        }
        
        if (tricksWonCount + futureCount === condition.win_min_tricks) {
          return { trickNumber: num, state: 'win', opacity }
        }
        
        return { trickNumber: num, state: 'neutral', opacity }
      }

      let state: 'win' | 'lose' | 'neutral' | 'blank' = 'blank'

      if (condition.win_trick_position?.includes(num)) {
        state = 'win'
      } else if (condition.lose_trick_position?.includes(num)) {
        state = 'lose'
      } else if (condition.may_win_trick_position?.includes(num)) {
        state = 'neutral'
      }

      return { trickNumber: num, state, opacity }
    })
  })

  return {
    trickBid,
    isBidLost,
    trickDisplays,
    setCollectionBid,
    setCollectionDisplay,
    pointsBid,
    pointsDisplay
  }
}
