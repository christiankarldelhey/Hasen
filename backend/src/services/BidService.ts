import { GameModel } from '@/models/Game.js'
import type { PlayerId } from '@domain/interfaces/Player'
import type { BidType } from '@domain/interfaces/Bid'
import type { TrickNumber } from '@domain/interfaces/Trick'
import { canMakeSpecificBid, calculateBidOnLose } from '@domain/rules/BidRules'
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

    const availableBids = game.round.roundBids.bids.filter((b: any) => b.bid_type === bidType)
    
    if (!availableBids || availableBids.length === 0) {
      throw new Error('No bids available')
    }

    const currentBid = bidId 
      ? availableBids.find((bid: any) => bid.bid_id === bidId)
      : availableBids[0]
    
    if (!currentBid) {
      throw new Error('Bid not found')
    }

    // Validar el bid específico que el jugador está intentando hacer
    const validation = canMakeSpecificBid(game, playerId, currentBid, trickNumber)
    if (!validation.canMakeBid) {
      throw new Error(validation.reason || 'Cannot make bid')
    }

    const onLose = calculateBidOnLose(bidType, trickNumber)

    if (!game.round.roundBids.playerBids[playerId]) {
      game.round.roundBids.playerBids[playerId] = []
    }

    game.round.roundBids.playerBids[playerId].push({
      bidId: currentBid.bid_id,
      trickNumber,
      onLose,
      isPlayerWinning: null
    })

    game.markModified('round.roundBids.playerBids')
    await game.save()

    const event = createBidMadeEvent(
      playerId,
      currentBid.bid_id,
      bidType,
      trickNumber as 1 | 2 | 3,
      currentBid.bid_score,
      onLose
    )

    return {
      game,
      event
    }
  }
}
