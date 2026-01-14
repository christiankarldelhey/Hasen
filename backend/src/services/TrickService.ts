import { GameModel } from '../models/Game.js'
import { createTrickStartedEvent } from '@domain/events/GameEvents.js'
import type { PlayerId, Trick, TrickNumber } from '@domain/interfaces'
import { randomUUID } from 'crypto'

export class TrickService {
  static async startTrick(gameId: string, leadPlayer?: PlayerId) {
    const game = await GameModel.findOne({ gameId });
    if (!game) throw new Error('Game not found');
    
    if (game.round.roundPhase !== 'playing') {
      throw new Error('Cannot start trick: round phase must be "playing"');
    }
    
    const currentTrickNumber = game.round.currentTrick 
      ? (game.round.currentTrick.trick_number + 1) as TrickNumber
      : 1;
    
    if (currentTrickNumber > 5) {
      throw new Error('Cannot start trick: maximum 5 tricks per round');
    }
    
    const determinedLeadPlayer = leadPlayer || game.playerTurnOrder[0];
    
    const newTrick: Trick = {
      trick_id: randomUUID(),
      trick_state: 'in_progress',
      trick_number: currentTrickNumber,
      lead_player: determinedLeadPlayer,
      winning_card: null,
      lead_suit: null,
      cards: [],
      score: {
        trick_winner: null,
        trick_points: 0,
        trick_collections: null
      }
    };
    
    game.round.currentTrick = newTrick;
    game.round.playerTurn = determinedLeadPlayer;
    
    await game.save();
    
    console.log(`✅ Trick ${currentTrickNumber} started with lead player: ${determinedLeadPlayer}`);
    
    const event = createTrickStartedEvent(
      newTrick.trick_id,
      currentTrickNumber,
      determinedLeadPlayer
    );
    
    return { game, event };
  }
}
