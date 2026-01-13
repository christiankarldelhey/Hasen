import mongoose, { Schema, Document } from 'mongoose';
import { Game } from '../../../domain/interfaces';

export interface GameDocument extends Omit<Game, 'gameId'>, Document {
  gameId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema para Card
const CardSchema = new Schema({
  id: { type: String, required: true },
  suit: { type: String, enum: ['berries', 'leaves', 'flowers', 'acorns'], required: true },
  char: { type: String, required: true },
  rank: {
    base: { type: Number, required: true },
    onSuit: { type: Number }
  },
  owner: { type: String, enum: ['player_1', 'player_2', 'player_3', 'player_4', null] },
  state: { type: String, enum: ['in_deck', 'in_hand_visible', 'in_hand_hidden', 'played', 'in_discard_pile'], required: true },
  points: { type: Number, required: true },
  spritePos: {
    row: { type: Number, required: true },
    col: { type: Number, required: true }
  }
}, { _id: false });

// Schema para PlayerBid
const PlayerBidSchema = new Schema({
  bidder: { type: String, enum: ['player_1', 'player_2', 'player_3', 'player_4', null] },
  onLose: { type: Number, required: true }
}, { _id: false });

// Schema para Bid
const BidSchema = new Schema({
  bid_id: { type: String, required: true },
  bid_type: { type: String, enum: ['points', 'set_collection', 'trick'], required: true },
  bid_score: { type: Number, required: true },
  current_bids: {
    trick_1: { type: PlayerBidSchema, required: true },
    trick_2: { type: PlayerBidSchema, required: true },
    trick_3: { type: PlayerBidSchema, required: true }
  },
  bid_winner: [{ type: String, enum: ['player_1', 'player_2', 'player_3', 'player_4'] }],
  win_condition: { type: Schema.Types.Mixed, required: true }
}, { _id: false });

// Schema para Trick
const TrickSchema = new Schema({
  trickNumber: { type: Number, required: true },
  leadPlayer: { type: String, enum: ['player_1', 'player_2', 'player_3', 'player_4'], required: true },
  cardsPlayed: { type: Schema.Types.Mixed, required: true },
  winner: { type: String, enum: ['player_1', 'player_2', 'player_3', 'player_4'] },
  points: { type: Number }
}, { _id: false });

// Schema para Round
const RoundSchema = new Schema({
  round: { type: Number, required: true },
  playerTurn: { type: String, enum: ['player_1', 'player_2', 'player_3', 'player_4', null] },
  roundPhase: { 
    type: String, 
    enum: ['round_setup', 'player_drawing', 'playing', 'scoring'],
    required: true 
  },
  roundBids: {
    points: { type: BidSchema, default: null },
    set_collection: { type: BidSchema, default: null },
    trick: { type: BidSchema, default: null }
  },
  currentTrick: { type: TrickSchema, default: null }
}, { _id: false });

// Schema para PlayerRoundScore
const PlayerRoundScoreSchema = new Schema({
  playerId: { type: String, enum: ['player_1', 'player_2', 'player_3', 'player_4'], required: true },
  points: { type: Number, required: true },
  totalScore: { type: Number, required: true },
  tricksWon: { type: Number, required: true },
  win_condition: { type: Schema.Types.Mixed, required: true }
}, { _id: false });

const GameSchema = new Schema<GameDocument>({
  gameId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  hostUserId: {
    type: String,
    required: false,
    default: 'playerId_1'
  },
  gameName: {
    type: String,
    required: true,
    default: 'My Hasen Game'
  },
  hostPlayer: {
    type: String,
    enum: ['player_1', 'player_2', 'player_3', 'player_4'],
    required: true,
    default: 'player_1'
  },
  activePlayers: [{
    type: String,
    enum: ['player_1', 'player_2', 'player_3', 'player_4'],
    required: true,
    default: []
  }],
  playerSessions: {
    type: Map,
    of: String,
    default: new Map(),
    required: false
  },
  deck: [CardSchema],
  discardPile: {
    type: [CardSchema],
    default: [],
    required: false
  },
  bidDecks: {
    setCollectionBidDeck: [BidSchema],
    pointsBidDeck: [BidSchema],
    tricksBidDeck: [BidSchema]
  },
  gamePhase: { 
    type: String, 
    enum: ['setup', 'playing', 'ended'],
    required: true,
    default: 'setup'
  },
  round: { 
    type: RoundSchema,
    required: true
  },
  playerTurnOrder: [{
    type: String,
    enum: ['player_1', 'player_2', 'player_3', 'player_4']
  }],
  tricksHistory: [TrickSchema],
  bidsHistory: [BidSchema],
  playerScores: [PlayerRoundScoreSchema],
  gameSettings: {
    minPlayers: { type: Number, required: true, default: 2 },
    maxPlayers: { type: Number, required: true, default: 4 },
    pointsToWin: { type: Number, required: true, default: 300 }
  }
}, {
  timestamps: true,
  collection: 'games'
});

GameSchema.index({ gameId: 1 });
GameSchema.index({ gamePhase: 1 });
GameSchema.index({ 'activePlayers': 1 });

export const GameModel = mongoose.model<GameDocument>('Game', GameSchema);