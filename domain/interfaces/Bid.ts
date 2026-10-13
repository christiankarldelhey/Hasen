import type { Suit } from './Card'
import type { TrickNumber } from './Trick'

export type BidType = 'points' | 'set_collection' | 'trick'
export type BidScore = number
export type PlayerCount = 2 | 3 | 4

export interface PointsBidCondition {
  min_points: number
  max_points: number
}

export interface SetCollectionBidCondition {
  win_suit: Suit
  floor: number
}

export interface TrickBidCondition {
  win_trick_position?: TrickNumber[]
  lose_trick_position?: TrickNumber[]
  may_win_trick_position?: TrickNumber[]
  win_min_tricks?: number
  win_max_tricks?: number
}

export interface PlayerBidEntry {
  bidId: string
  trickNumber: TrickNumber
  onLose: number
  isPlayerWinning: boolean | null
}

export interface PlayerBidsMap {
  player_1?: PlayerBidEntry[]
  player_2?: PlayerBidEntry[]
  player_3?: PlayerBidEntry[]
  player_4?: PlayerBidEntry[]
}

export interface Bid {
  bid_id: string
  bid_type: BidType
  /** Premio por cumplir (o valor por carta del palo en Colección), ya resuelto para la cantidad de jugadores de la partida */
  bid_score: BidScore
  win_condition: PointsBidCondition | SetCollectionBidCondition | TrickBidCondition
}

export interface BidPool {
  bids: Bid[]
  playerBids: PlayerBidsMap
}
