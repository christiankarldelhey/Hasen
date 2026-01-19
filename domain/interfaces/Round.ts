import type { PlayerId } from './Player'
import type { Trick, TrickNumber } from './Trick'
import type { Bid } from './Bid'

export type RoundPhase = 
  | 'round_setup'
  | 'player_drawing'
  | 'playing'
  | 'scoring'

export interface RoundBids {
  pointsBids: Bid[]
  setCollectionBids: Bid[]
  trickBids: Bid[]
}

export interface Round {
  round: number
  playerTurn: PlayerId
  roundBids: RoundBids
  roundPhase: RoundPhase
  currentTrick: Trick | null
  roundScore: PlayerRoundScore[]
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