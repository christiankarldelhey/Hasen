import type { PublicGameState, PrivateGameState } from '@domain/interfaces/Game'
import type { PlayerId } from '@domain/interfaces/Player'
import type { 
  GameEvent,
  DeckShuffledEvent,
  RoundSetupCompletedEvent,
  FirstCardDealtEvent,
  RemainingCardsDealtEvent,
  TrickStartedEvent,
  CardPlayedEvent,
  TrickCompletedEvent,
  RoundEndedEvent,
  BidMadeEvent
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

const handleDeckShuffled: GameEventHandler = (event, context) => {
  if (event.type !== 'DECK_SHUFFLED') return
  
  const payload = (event as DeckShuffledEvent).payload
  console.log(`🎴 Deck shuffled for round ${payload.round}, ${payload.deckSize} cards`)
}

const handleRoundSetupCompleted: GameEventHandler = (event, context) => {
  if (event.type !== 'ROUND_SETUP_COMPLETED') return
  if (!context.publicGameState) return
  
  const payload = (event as RoundSetupCompletedEvent).payload
  context.publicGameState.round.round = payload.round
  context.publicGameState.round.roundBids = payload.roundBids
  
  console.log(`✅ Round ${payload.round} setup completed`)
}

const handleFirstCardDealt: GameEventHandler = (event, context) => {
  if (event.type !== 'FIRST_CARD_DEALT') return
  
  const payload = (event as FirstCardDealtEvent).payload
  console.log('🃏 First cards dealt (visible):', payload.firstCards)
  
  if (!context.currentPlayerId || !context.publicGameState) return
  
  // Populate publicCards map
  context.publicGameState.publicCards = {}
  payload.firstCards.forEach((fc: any) => {
    context.publicGameState!.publicCards[fc.card.id] = fc.card
  })
  
  // Populate opponentsPublicInfo with references and initial hand count
  context.publicGameState.opponentsPublicInfo = payload.firstCards.map((fc: any) => ({
    playerId: fc.playerId,
    publicCardId: fc.card.id,
    handCardsCount: 5
  }))
  
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

const handleCardPlayed: GameEventHandler = (event, context) => {
  if (event.type !== 'CARD_PLAYED') return
  if (!context.publicGameState) return
  
  const payload = (event as CardPlayedEvent).payload
  
  // Agregar la carta jugada al mapa de cartas públicas
  context.publicGameState.publicCards[payload.card.id] = payload.card
  
  console.log(`🃏 Card played by ${payload.playerId}:`, payload.card.char, payload.card.suit)
}

const handleTrickCompleted: GameEventHandler = (event, _context) => {
  if (event.type !== 'TRICK_COMPLETED') return
  
  const payload = (event as TrickCompletedEvent).payload
  
  console.log(`🏆 Trick ${payload.trickNumber} completed!`)
  console.log(`   Winner: ${payload.winner}`)
  console.log(`   Points: ${payload.points}`)
  console.log(`   Cards: ${payload.cards.length}`)
  
  // Los scores se actualizarán automáticamente cuando llegue el game:stateUpdate
  // que incluye los playerScores actualizados desde el backend
}

const handleRoundEnded: GameEventHandler = (event, _context) => {
  if (event.type !== 'ROUND_ENDED') return
  console.log('🏁 Round ended:', (event as RoundEndedEvent).payload)
}

const handleBidMade: GameEventHandler = (event, context) => {
  if (event.type !== 'BID_MADE') return
  if (!context.publicGameState) return
  
  const payload = (event as BidMadeEvent).payload
  const playerBids = context.publicGameState.round.roundBids.playerBids
  
  if (!playerBids) return
  
  if (!playerBids[payload.playerId]) {
    playerBids[payload.playerId] = []
  }
  
  playerBids[payload.playerId]?.push({
    bidId: payload.bidId,
    trickNumber: payload.trickNumber,
    onLose: payload.onLose
  })
  
  console.log(`🎯 Bid made by ${payload.playerId}: ${payload.bidType} on trick ${payload.trickNumber} (${payload.bidScore} points)`)
}

export const gameEventHandlers: Record<string, GameEventHandler> = {
  'DECK_SHUFFLED': handleDeckShuffled,
  'ROUND_SETUP_COMPLETED': handleRoundSetupCompleted,
  'FIRST_CARD_DEALT': handleFirstCardDealt,
  'REMAINING_CARDS_DEALT_PRIVATE': handleRemainingCardsDealtPrivate,
  'TRICK_STARTED': handleTrickStarted,
  'CARD_PLAYED': handleCardPlayed,
  'TRICK_COMPLETED': handleTrickCompleted,
  'ROUND_ENDED': handleRoundEnded,
  'BID_MADE': handleBidMade,
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
