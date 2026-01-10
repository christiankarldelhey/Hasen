import type { PublicGameState, PrivateGameState } from '@domain/interfaces/Game'
import type { PlayerId } from '@domain/interfaces/Player'
import type { 
  GameEvent,
  RoundSetupCompletedEvent,
  FirstCardDealtEvent,
  RemainingCardsDealtEvent,
  TrickStartedEvent,
  TrickCompletedEvent,
  RoundEndedEvent
} from '@domain/events/GameEvents'

export interface GameEventContext {
  publicGameState: PublicGameState | null
  privateGameState: PrivateGameState | null
  currentPlayerId: PlayerId | ''
}

export type GameEventHandler = (
  event: GameEvent,
  context: GameEventContext
) => void

const handleRoundSetupCompleted: GameEventHandler = (event, context) => {
  if (event.type !== 'ROUND_SETUP_COMPLETED') return
  if (!context.publicGameState) return
  
  const payload = (event as RoundSetupCompletedEvent).payload
  context.publicGameState.round.round = payload.round
  context.publicGameState.round.roundPhase = 'player_drawing'
  context.publicGameState.round.roundBids = payload.roundBids
  
  console.log(`✅ Round ${payload.round} setup completed`)
}

const handleFirstCardDealt: GameEventHandler = (event, context) => {
  if (event.type !== 'FIRST_CARD_DEALT') return
  
  const payload = (event as FirstCardDealtEvent).payload
  console.log('🃏 First cards dealt (visible):', payload.firstCards)
  
  if (!context.currentPlayerId || !context.publicGameState) return
  
  context.publicGameState.playersFirstCards = payload.firstCards
  
  const myFirstCard = payload.firstCards.find(
    (fc: any) => fc.playerId === context.currentPlayerId
  )
  
  if (myFirstCard && context.privateGameState) {
    context.privateGameState.hand = [myFirstCard.card]
    console.log('🃏 Received first visible card')
  }
}

const handleRemainingCardsDealtPrivate: GameEventHandler = (event, context) => {
  if (event.type !== 'REMAINING_CARDS_DEALT_PRIVATE') return
  if (!context.privateGameState) return
  
  const payload = (event as RemainingCardsDealtEvent).payload
  if (context.privateGameState.playerId !== payload.playerId) return
  
  context.privateGameState.hand = [
    ...(context.privateGameState.hand || []),
    ...payload.cards
  ]
  
  console.log('🃏 Received 4 private cards. Total hand:', context.privateGameState.hand.length)
}

const handleTrickStarted: GameEventHandler = (event, _context) => {
  if (event.type !== 'TRICK_STARTED') return
  console.log('🎯 Trick started:', (event as TrickStartedEvent).payload)
}

const handleTrickCompleted: GameEventHandler = (event, _context) => {
  if (event.type !== 'TRICK_COMPLETED') return
  console.log('✅ Trick completed:', (event as TrickCompletedEvent).payload)
}

const handleRoundEnded: GameEventHandler = (event, _context) => {
  if (event.type !== 'ROUND_ENDED') return
  console.log('🏁 Round ended:', (event as RoundEndedEvent).payload)
}

export const gameEventHandlers: Record<string, GameEventHandler> = {
  'ROUND_SETUP_COMPLETED': handleRoundSetupCompleted,
  'FIRST_CARD_DEALT': handleFirstCardDealt,
  'REMAINING_CARDS_DEALT_PRIVATE': handleRemainingCardsDealtPrivate,
  'TRICK_STARTED': handleTrickStarted,
  'TRICK_COMPLETED': handleTrickCompleted,
  'ROUND_ENDED': handleRoundEnded,
}

export function processGameEvent(
  event: GameEvent,
  context: GameEventContext
): void {
  const handler = gameEventHandlers[event.type]
  
  if (handler) {
    handler(event, context)
  } else {
    console.warn(`⚠️ No handler found for event type: ${event.type}`)
  }
}
