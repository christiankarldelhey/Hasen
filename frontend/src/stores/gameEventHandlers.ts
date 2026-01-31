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
  BidMadeEvent,
  CardReplacementSkippedEvent,
  CardReplacementCompletedEvent
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
  context.publicGameState.round.roundPhase = payload.roundPhase
  context.publicGameState.round.playerTurn = payload.playerTurn
  context.publicGameState.round.currentTrick = payload.currentTrick
  context.publicGameState.round.roundScore = []
  
  console.log(`✅ Round ${payload.round} setup completed, phase: ${payload.roundPhase}, turn: ${payload.playerTurn}`)
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

const handleCardReplacedPrivate: GameEventHandler = (event, context) => {
  if (event.type !== 'CARD_REPLACED_PRIVATE') return
  if (!context.privateGameState || !context.privateGameState.hand) return
  
  const payload = (event as any).payload
  if (context.privateGameState.playerId !== payload.playerId) return
  
  // Remove the old card and add the new card
  context.privateGameState.hand = context.privateGameState.hand.filter(
    card => card.id !== payload.cardToReplace.id
  )
  context.privateGameState.hand.push(payload.replacementCard)
  
  console.log(`🔄 Card replaced: ${payload.cardToReplace.char} → ${payload.replacementCard.char}`)
}

const handleTrickStarted: GameEventHandler = (event, context) => {
  if (event.type !== 'TRICK_STARTED') return
  if (!context.publicGameState) return
  
  const payload = (event as TrickStartedEvent).payload
  
  // Update round phase to 'playing'
  context.publicGameState.round.roundPhase = 'playing'
  
  // Set playerTurn to lead_player (who starts the trick)
  context.publicGameState.round.playerTurn = payload.leadPlayer
  
  // Initialize current trick
  context.publicGameState.round.currentTrick = {
    trick_id: payload.trick_id,
    trick_state: 'in_progress',
    trick_number: payload.trickNumber,
    lead_player: payload.leadPlayer,
    winning_card: null,
    lead_suit: null,
    cards: [],
    score: {
      trick_winner: null,
      trick_points: 0,
      trick_collections: null
    }
  }
  
  console.log(`🎯 Trick ${payload.trickNumber} started, lead: ${payload.leadPlayer}, turn: ${payload.leadPlayer}, phase: playing`)
}

const handleCardPlayed: GameEventHandler = (event, context) => {
  if (event.type !== 'CARD_PLAYED') return
  if (!context.publicGameState || !context.publicGameState.round.currentTrick) return
  
  const payload = (event as CardPlayedEvent).payload
  
  // Agregar la carta jugada al mapa de cartas públicas
  context.publicGameState.publicCards[payload.card.id] = payload.card
  
  // Agregar la carta al trick actual
  context.publicGameState.round.currentTrick.cards.push(payload.card.id)
  
  // NO actualizar playerTurn aquí - se actualizará cuando llegue TURN_FINISHED
  // Esto permite que el jugador vea el botón "Finish Turn" y pueda hacer bids
  
  // Si es el jugador actual, remover la carta de su mano
  if (context.privateGameState && 
      context.privateGameState.playerId === payload.playerId && 
      context.privateGameState.hand) {
    context.privateGameState.hand = context.privateGameState.hand.filter(
      card => card.id !== payload.card.id
    )
  }
  
  console.log(`🃏 Card played by ${payload.playerId}: ${payload.card.char} of ${payload.card.suit}, next: ${payload.nextPlayer}`)
}

const handleTrickCompleted: GameEventHandler = (event, context) => {
  if (event.type !== 'TRICK_COMPLETED') return
  if (!context.publicGameState || !context.publicGameState.round.currentTrick) return
  
  const payload = (event as TrickCompletedEvent).payload
  
  // Update trick state to 'resolve'
  context.publicGameState.round.currentTrick.trick_state = 'resolve'
  context.publicGameState.round.currentTrick.winning_card = payload.winningCard
  context.publicGameState.round.currentTrick.score = {
    trick_winner: payload.winner,
    trick_points: payload.points,
    trick_collections: payload.collections
  }
  
  // Update roundScore
  if (!context.publicGameState.round.roundScore) {
    context.publicGameState.round.roundScore = []
  }
  
  let playerScore = context.publicGameState.round.roundScore.find(
    score => score.playerId === payload.winner
  )
  
  if (!playerScore) {
    playerScore = {
      playerId: payload.winner,
      points: 0,
      tricksWon: [],
      setCollection: { acorns: 0, leaves: 0, berries: 0, flowers: 0 }
    }
    context.publicGameState.round.roundScore.push(playerScore)
  }
  
  playerScore.points += payload.points
  playerScore.tricksWon.push(payload.trickNumber)
  if (payload.collections) {
    playerScore.setCollection.acorns += payload.collections.acorns || 0
    playerScore.setCollection.leaves += payload.collections.leaves || 0
    playerScore.setCollection.berries += payload.collections.berries || 0
    playerScore.setCollection.flowers += payload.collections.flowers || 0
  }
  
  console.log(`🏆 Trick ${payload.trickNumber} completed! Winner: ${payload.winner} (${payload.points} points)`)
}

const handleRoundEnded: GameEventHandler = (event, context) => {
  if (event.type !== 'ROUND_ENDED') return
  if (!context.publicGameState) return
  
  const payload = (event as RoundEndedEvent).payload
  
  // Update accumulated player scores if provided
  if (payload.playerScores) {
    context.publicGameState.playerScores = payload.playerScores
  }
  
  console.log('🏁 Round ended:', payload.round)
  console.log('📊 Round scores:', payload.scores)
  if (payload.playerScores) {
    console.log('📈 Accumulated scores:', payload.playerScores)
  }
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
    onLose: payload.onLose,
    isPlayerWinning: null
  })
  
  console.log(`🎯 Bid made by ${payload.playerId}: ${payload.bidType} on trick ${payload.trickNumber} (${payload.bidScore} points)`)
}

const handleTurnFinished: GameEventHandler = (event, context) => {
  if (event.type !== 'TURN_FINISHED') return
  if (!context.publicGameState) return
  
  const payload = (event as any).payload
  context.publicGameState.round.playerTurn = payload.nextPlayer
  
  console.log(`🔄 Turn finished: ${payload.playerId} → ${payload.nextPlayer}`)
}

const handleTrickFinished: GameEventHandler = (event, context) => {
  if (event.type !== 'TRICK_FINISHED') return
  if (!context.publicGameState) return
  
  const payload = (event as any).payload
  
  // Clear current trick (moved to history)
  context.publicGameState.round.currentTrick = null
  
  console.log(`✅ Trick ${payload.trickNumber} moved to history, ready for trick ${payload.nextTrickNumber}`)
}

const handleCardReplacementSkipped: GameEventHandler = (event, context) => {
  if (event.type !== 'CARD_REPLACEMENT_SKIPPED') return
  if (!context.publicGameState) return
  
  const payload = (event as CardReplacementSkippedEvent).payload
  context.publicGameState.round.playerTurn = payload.nextPlayerId
  
  console.log(`⏭️ ${payload.playerId} skipped card replacement, next turn: ${payload.nextPlayerId}`)
}

const handleCardReplacementCompleted: GameEventHandler = (event, context) => {
  if (event.type !== 'CARD_REPLACEMENT_COMPLETED') return
  if (!context.publicGameState) return
  
  const payload = (event as CardReplacementCompletedEvent).payload
  context.publicGameState.round.playerTurn = payload.nextPlayerId
  
  console.log(`🔄 ${payload.playerId} replaced card, next turn: ${payload.nextPlayerId}`)
}

export const gameEventHandlers: Record<string, GameEventHandler> = {
  'DECK_SHUFFLED': handleDeckShuffled,
  'ROUND_SETUP_COMPLETED': handleRoundSetupCompleted,
  'FIRST_CARD_DEALT': handleFirstCardDealt,
  'REMAINING_CARDS_DEALT_PRIVATE': handleRemainingCardsDealtPrivate,
  'CARD_REPLACED_PRIVATE': handleCardReplacedPrivate,
  'TRICK_STARTED': handleTrickStarted,
  'CARD_PLAYED': handleCardPlayed,
  'TRICK_COMPLETED': handleTrickCompleted,
  'ROUND_ENDED': handleRoundEnded,
  'BID_MADE': handleBidMade,
  'TURN_FINISHED': handleTurnFinished,
  'TRICK_FINISHED': handleTrickFinished,
  'CARD_REPLACEMENT_SKIPPED': handleCardReplacementSkipped,
  'CARD_REPLACEMENT_COMPLETED': handleCardReplacementCompleted,
}

export function processGameEvent(
  event: GameEvent,
  context: GameEventContext
): void {
  const handler = gameEventHandlers[event.type]
  
  if (handler) {
    handler(event, context)
  } else {
    console.warn(`No handler found for event type: ${event.type}`)
  }
}
