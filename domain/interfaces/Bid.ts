import { PlayerId } from './Player'
import { Suit } from './Card'
import { TrickNumber } from './Trick'

export type BidType = 'points' | 'set_collection' | 'trick'
export type BidScore = number
export type WinThisTrick = boolean | null

export interface PointsBidCondition {
  min_points: number
  max_points: number
}

export interface SetCollectionBidCondition {
  win_suit: Suit
  avoid_suit: Suit
}

export interface TrickBidCondition {
  win_trick_position?: TrickNumber[]
  lose_trick_position?: TrickNumber[]
  win_min_tricks?: TrickNumber
  win_max_tricks?: TrickNumber
}

export interface PlayerBid {
  bidder: PlayerId | null;
  onLose: number;
}

export interface Bid {
  bid_id: number
  bid_type: BidType
  bid_score: BidScore
  current_bids: {
    trick_1: PlayerBid;
    trick_2: PlayerBid;
    trick_3: PlayerBid;
  }
  bid_winner: PlayerId[] | null
  win_condition: PointsBidCondition | SetCollectionBidCondition | TrickBidCondition
}

export interface BidPool {
  setCollectionBids: [Bid, Bid, Bid]
  pointsBids: [Bid, Bid, Bid]
  trickBids: [Bid, Bid, Bid]
}