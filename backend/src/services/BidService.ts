import { GameModel } from '@/models/Game.js'
import type { PlayerId } from '@domain/interfaces/Player'
import type { BidType } from '@domain/interfaces/Bid'
import type { TrickNumber } from '@domain/interfaces/Trick'
import { canMakeBid } from '@domain/rules/BidRules'
import { createBidMadeEvent } from '@domain/events/GameEvents'

export class BidService {
  static async makeBid(
    gameId: string,
    playerId: PlayerId,
    bidType: BidType,
    trickNumber: TrickNumber,
    bidId?: string
  ) {
    const game = await GameModel.findOne({ gameId })
    if (!game) {
      throw new Error('Game not found')
    }

    if (trickNumber > 3) {
      throw new Error('Solo puedes hacer bids en los primeros 3 tricks')
    }

    const validation = canMakeBid(game, playerId, bidType, trickNumber)
    if (!validation.canMakeBid) {
      throw new Error(validation.reason || 'Cannot make bid')
    }

    const bidArrayKey = bidType === 'points' ? 'pointsBids' : bidType === 'set_collection' ? 'setCollectionBids' : 'trickBids'
    const bidsArray = game.round.roundBids[bidArrayKey] as any
    
    if (!bidsArray || bidsArray.length === 0) {
      throw new Error('No bids available')
    }

    const currentBid = bidId 
      ? bidsArray.find((bid: any) => bid.bid_id === bidId)
      : bidsArray[0]
    
    if (!currentBid) {
      throw new Error('Bid not found')
    }

    const trickKey = `trick_${trickNumber}` as 'trick_1' | 'trick_2' | 'trick_3'
    const existingOnLose = currentBid.current_bids[trickKey].onLose
    
    currentBid.current_bids[trickKey] = {
      bidder: playerId,
      onLose: existingOnLose
    }

    await game.save()

    const event = createBidMadeEvent(
      playerId,
      currentBid.bid_id,
      bidType,
      trickNumber as 1 | 2 | 3,
      currentBid.bid_score
    )

    return {
      game,
      event
    }
  }
}
