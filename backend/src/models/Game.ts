import mongoose, { Schema, Document } from 'mongoose';
import { Game } from '../../../domain/interfaces';

export interface GameDocument extends Omit<Game, 'gameId'>, Document {
  gameId: string;
}

const GameSchema = new Schema<GameDocument>({
  gameId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
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
  deck: [Schema.Types.Mixed],
  bidDecks: {
    setCollectionBidDeck: [Schema.Types.Mixed],
    pointsBidDeck: [Schema.Types.Mixed],
    tricksBidDeck: [Schema.Types.Mixed]
  },
  gamePhase: { 
    type: String, 
    enum: ['setup', 'playing', 'ended'],
    required: true,
    default: 'setup'
  },
  round: { 
    type: Schema.Types.Mixed,
    required: true
  },
  playerTurnOrder: [{
    type: String,
    enum: ['player_1', 'player_2', 'player_3', 'player_4']
  }],
  tricksHistory: [Schema.Types.Mixed],
  bidsHistory: [Schema.Types.Mixed],
  playerScores: [Schema.Types.Mixed],
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