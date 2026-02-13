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
  state: { type: String, enum: ['in_deck', 'in_hand_visible', 'in_hand_hidden', 'in_trick', 'in_finished_trick', 'in_discard_pile'], required: true },
  points: { type: Number, required: true },
  spritePos: {
    row: { type: Number, required: true },
    col: { type: Number, required: true }
  }
}, { _id: false });

// Schema para PlayerBidEntry
const PlayerBidEntrySchema = new Schema({
  bidId: { type: String, required: true },
  trickNumber: { type: Number, required: true, enum: [1, 2, 3] },
  onLose: { type: Number, required: true },
  isPlayerWinning: { type: Boolean, default: null }
}, { _id: false });

// Schema para Bid
const BidSchema = new Schema({
  bid_id: { type: String, required: true },
  bid_type: { type: String, enum: ['points', 'set_collection', 'trick'], required: true },
  bid_score: { type: Number, required: true },
  win_condition: { type: Schema.Types.Mixed, required: true }
}, { _id: false });

// Schema para TrickScore
const TrickScoreSchema = new Schema({
  trick_winner: { type: String, enum: ['player_1', 'player_2', 'player_3', 'player_4', null], default: null },
  trick_points: { type: Number, required: true, default: 0 },
  trick_collections: { type: Schema.Types.Mixed, default: null }
}, { _id: false });

// Schema para Trick
const TrickSchema = new Schema({
  trick_id: { type: String, required: true },
  trick_state: { type: String, enum: ['in_progress', 'awaiting_special_action', 'resolve', 'ended'], required: true },
  trick_number: { type: Number, required: true },
  lead_player: { type: String, enum: ['player_1', 'player_2', 'player_3', 'player_4'], required: true },
  winning_card: { type: String, default: null },
  lead_suit: { type: String, enum: ['acorns', 'leaves', 'berries', null], default: null },
  cards: [{ type: String }],
  stolenCards: { type: [String], default: [] },
  pendingSpecialAction: { type: Schema.Types.Mixed, default: null },
  score: { type: TrickScoreSchema, required: true }
}, { _id: false });

// Schema para PlayerRoundScore
const PlayerRoundScoreSchema = new Schema({
  playerId: { type: String, enum: ['player_1', 'player_2', 'player_3', 'player_4'], required: true },
  points: { type: Number, required: true, default: 0 },
  tricksWon: [{ type: Number, enum: [1, 2, 3, 4, 5] }],
  setCollection: {
    acorns: { type: Number, required: true, default: 0 },
    leaves: { type: Number, required: true, default: 0 },
    berries: { type: Number, required: true, default: 0 },
    flowers: { type: Number, required: true, default: 0 }
  }
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
    bids: { type: [BidSchema], default: [] },
    playerBids: {
      player_1: { type: [PlayerBidEntrySchema], default: [] },
      player_2: { type: [PlayerBidEntrySchema], default: [] },
      player_3: { type: [PlayerBidEntrySchema], default: [] },
      player_4: { type: [PlayerBidEntrySchema], default: [] }
    }
  },
  currentTrick: { type: TrickSchema, default: null },
  roundScore: [{ type: PlayerRoundScoreSchema }],
  playersReadyForNextRound: { type: [String], default: [] }
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
  playerScores: [{
    playerId: { type: String, enum: ['player_1', 'player_2', 'player_3', 'player_4'], required: true },
    score: { type: Number, required: true, default: 0 }
  }],
  winner: {
    type: String,
    enum: ['player_1', 'player_2', 'player_3', 'player_4', null],
    default: null,
    required: false
  },
  gameSettings: {
    minPlayers: { type: Number, required: true, default: 2 },
    maxPlayers: { type: Number, required: true, default: 4 },
    pointsToWin: { type: Number, required: true, default: 300 },
    reconnectionTimeoutMinutes: { type: Number, required: true, default: 3 }
  },
  playerConnectionStatus: {
    type: Map,
    of: String,
    enum: ['connected', 'disconnected', 'reconnecting'],
    default: new Map(),
    required: false
  },
  disconnectionTimestamps: {
    type: Map,
    of: Number,
    default: new Map(),
    required: false
  },
  isPaused: {
    type: Boolean,
    default: false,
    required: false
  },
  pauseReason: {
    type: String,
    enum: ['player_disconnected', null],
    default: null,
    required: false
  }
}, {
  timestamps: true,
  collection: 'games'
});

GameSchema.index({ gameId: 1 });
GameSchema.index({ gamePhase: 1 });
GameSchema.index({ 'activePlayers': 1 });

export const GameModel = mongoose.model<GameDocument>('Game', GameSchema);