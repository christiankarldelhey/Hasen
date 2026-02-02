import type { PlayerId } from './Player'
import type { Trick, TrickNumber } from './Trick'
import type { Bid, PlayerBidsMap } from './Bid'

export type RoundPhase = 
  | 'round_setup'
  | 'player_drawing'
  | 'playing'
  | 'scoring'

export interface RoundBids {
  bids: Bid[]
  playerBids: PlayerBidsMap
}

export interface Round {
  round: number
  playerTurn: PlayerId
  roundBids: RoundBids
  roundPhase: RoundPhase
  currentTrick: Trick | null
  roundScore: PlayerRoundScore[]
  pendingNextLeadSelection?: {
    playerId: PlayerId
    nextTrickNumber: TrickNumber
  }
  pendingCardSteal?: {
    playerId: PlayerId
    trickNumber: TrickNumber
    availableCards: string[]
  }
  roundEndConfirmations?: PlayerId[]
}

export interface PlayerRoundScore {
  playerId: PlayerId
  points: number
  tricksWon: TrickNumber[]
  setCollection: {
    acorns: number,
    leaves: number,
    berries: number,
    flowers: number
  }
}