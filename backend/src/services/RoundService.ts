import { GameModel } from '../models/Game.js'
import { shuffleDeck } from '@domain/rules/DeckRules.js'
import { createDeckShuffledEvent } from '@domain/events/GameEvents.js'


export class RoundService {
  static async startNewRound(gameId: string) {
  const game = await GameModel.findOne({ gameId });
  if (!game) throw new Error('Game not found');
  
  game.round.round += 1;
  game.deck = shuffleDeck(game.deck);
  game.deck.forEach(card => {
    card.state = 'in_deck';
    card.owner = null;
  });
  
  game.round.roundPhase = 'shuffle';
  game.round.roundBids = {
    points: [null, null],
    set_collection: [null, null],
    trick: [null, null]
  };
  game.round.currentTrick = null;
  
  await game.save();
  console.log('backend: sart new round');
  const event = createDeckShuffledEvent(game.round.round, game.deck.length);

  // Return shuffle event
  return { game, event };
}

static async updateRoundPhase(gameId: string, phase: string) {
  console.log('updateRoundPhase', phase);
  const game = await GameModel.findOne({ gameId });
  if (!game) throw new Error('Game not found');
  
  game.round.roundPhase = phase;
  await game.save();
  
  return { game };
}

}