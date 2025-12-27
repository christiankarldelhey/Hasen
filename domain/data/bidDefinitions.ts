import { BidType, BidScore, PointsBidCondition, SetCollectionBidCondition, TrickBidCondition } from "../interfaces";

interface BidDefinition {
  type: BidType
  score: BidScore
  win_condition: PointsBidCondition | SetCollectionBidCondition | TrickBidCondition
}

export const BID_DEFINITIONS: BidDefinition[] = [
  // SET COLLECTION
  { type: 'set_collection', score: 10, win_condition: { win_suit: 'acorns', avoid_suit: 'leaves' } },
  { type: 'set_collection', score: 10, win_condition: { win_suit: 'acorns', avoid_suit: 'berries' } },
  { type: 'set_collection', score: 10, win_condition: { win_suit: 'berries', avoid_suit: 'acorns' } },
  { type: 'set_collection', score: 10, win_condition: { win_suit: 'berries', avoid_suit: 'leaves' } },
  { type: 'set_collection', score: 10, win_condition: { win_suit: 'leaves', avoid_suit: 'berries' } },
  { type: 'set_collection', score: 10, win_condition: { win_suit: 'leaves', avoid_suit: 'acorns' } },

  // POINTS
  { type: 'points', score: 30, win_condition: { min_points: 5, max_points: 20 } },
  { type: 'points', score: 40, win_condition: { min_points: 2, max_points: 10 } },
  { type: 'points', score: 40, win_condition: { min_points: 11, max_points: 30 } },
  { type: 'points', score: 40, win_condition: { min_points: 3, max_points: 15 } },
  { type: 'points', score: 45, win_condition: { min_points: 35, max_points: 100 } },
  { type: 'points', score: 55, win_condition: { min_points: 45, max_points: 100 } },
  { type: 'points', score: 35, win_condition: { min_points: 22, max_points: 40 } },

  // TRICKS
  { type: 'trick', score: 40, win_condition: { win_trick_position: [4, 5], lose_trick_position: [1, 2, 3] } },
  { type: 'trick', score: 30, win_condition: { win_trick_position: [4, 5] } },
  { type: 'trick', score: 55, win_condition: { win_trick_position: [1, 2, 3, 4, 5] } },
  { type: 'trick', score: 45, win_condition: { win_min_tricks: 4, win_max_tricks: 5 } },
  { type: 'trick', score: 45, win_condition: { win_min_tricks: 1, win_max_tricks: 1 } },
]