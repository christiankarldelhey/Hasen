import { computed } from 'vue'
import type { TrickNumber } from '@domain/interfaces/Trick'
import type { PlayerBidEntry, Bid, TrickBidCondition } from '@domain/interfaces/Bid'

export interface TrickDisplayInfo {
  trickNumber: TrickNumber
  state: 'win' | 'lose' | 'neutral' | 'blank'
  opacity: number
}

export function usePlayerScore(
  playerBids: PlayerBidEntry[],
  tricksWon: TrickNumber[],
  currentTrick: number,
  allBids: Bid[]
) {
  const trickBid = computed(() => {
    const trickBidEntry = playerBids.find(entry => {
      const bid = allBids.find(b => b.bid_id === entry.bidId)
      return bid?.bid_type === 'trick'
    })
    
    if (!trickBidEntry) return null
    
    const bid = allBids.find(b => b.bid_id === trickBidEntry.bidId)
    return bid ? { ...bid, win_condition: bid.win_condition as TrickBidCondition } : null
  })

  const isBidLost = computed(() => {
    if (!trickBid.value) return false
    
    const condition = trickBid.value.win_condition
    const tricksWonCount = tricksWon.length
    const tricksPlayed = Math.max(0, currentTrick - 1)
    const tricksRemaining = 5 - tricksPlayed

    if (condition.win_min_tricks !== undefined && condition.win_max_tricks !== undefined) {
      if (tricksWonCount > condition.win_max_tricks) return true
      if (tricksWonCount + tricksRemaining < condition.win_min_tricks) return true
    }

    if (condition.win_trick_position) {
      for (const pos of condition.win_trick_position) {
        if (pos < currentTrick && !tricksWon.includes(pos)) {
          return true
        }
      }
    }

    if (condition.lose_trick_position) {
      for (const pos of condition.lose_trick_position) {
        if (pos < currentTrick && tricksWon.includes(pos)) {
          return true
        }
      }
    }

    return false
  })

  const trickDisplays = computed((): TrickDisplayInfo[] => {
    const trickNumbers: TrickNumber[] = [1, 2, 3, 4, 5]
    
    if (!trickBid.value) {
      return trickNumbers.map(num => ({
        trickNumber: num,
        state: 'blank' as const,
        opacity: num >= currentTrick ? 0.7 : 1
      }))
    }

    const condition = trickBid.value.win_condition
    const tricksWonCount = tricksWon.length

    return trickNumbers.map(num => {
      const isPast = num < currentTrick
      const opacity = num >= currentTrick ? 0.7 : 1

      if (isPast) {
        const won = tricksWon.includes(num)
        return {
          trickNumber: num,
          state: won ? 'win' : 'lose',
          opacity
        }
      }

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
    trickDisplays
  }
}
