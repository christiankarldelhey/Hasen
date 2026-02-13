import type { PublicGameState, PrivateGameState } from '@domain/interfaces/Game'
import type { PlayerId } from '@domain/interfaces/Player'
import type { 
  GameEvent,
  DeckShuffledEvent,
  RoundSetupCompletedEvent,
  FirstCardDealtEvent,
  RemainingCardsDealtEvent,
  CardReplacedPrivateEvent,
  TrickStartedEvent,
  CardPlayedEvent,
  TrickCompletedEvent,
  RoundEndedEvent,
  BidMadeEvent,
  CardReplacementSkippedEvent,
  CardReplacementCompletedEvent,
  GameEndedEvent,
  PickNextLeadEvent,
  NextLeadPlayerSelectedEvent,
  PickCardFromTrickEvent,
  CardStolenFromTrickEvent,
  TurnFinishedEvent,
  TrickFinishedEvent
} from '@domain/events/GameEvents'
import { audioService } from '../common/services/AudioService'

export interface GameEventContext {
  publicGameState: PublicGameState | null
  privateGameState: PrivateGameState | null
  currentPlayerId: PlayerId | ''
}

export type GameEventHandler = (
  event: GameEvent,
  context: GameEventContext
) => void

const handleDeckShuffled: GameEventHandler = (event, _context) => {
  if (event.type !== 'DECK_SHUFFLED') return
  
  const payload = (event as DeckShuffledEvent).payload
  console.log(`🎴 DECK_SHUFFLED: Round ${payload.round}`)
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
  
  console.log(`✅ ROUND_SETUP_COMPLETED: Round ${payload.round}`)
}

const handleFirstCardDealt: GameEventHandler = (event, context) => {
  if (event.type !== 'FIRST_CARD_DEALT') return
  
  const payload = (event as FirstCardDealtEvent).payload
  
  if (!context.currentPlayerId || !context.publicGameState) return
  
  // Populate publicCards map
  context.publicGameState.publicCards = {}
  payload.firstCards.forEach((fc) => {
    context.publicGameState!.publicCards[fc.card.id] = fc.card
  })
  
  // Populate opponentsPublicInfo with references and initial hand count
  context.publicGameState.opponentsPublicInfo = payload.firstCards.map((fc) => ({
    playerId: fc.playerId,
    publicCardId: fc.card.id,
    handCardsCount: 5
  }))
  
  const myFirstCard = payload.firstCards.find(
    (fc) => fc.playerId === context.currentPlayerId
  )
  
  if (myFirstCard && context.privateGameState) {
    context.privateGameState.hand = [myFirstCard.card]
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
  
  audioService.playSoundEffect('dealCards')
}

const handleCardReplacedPrivate: GameEventHandler = (event, context) => {
  if (event.type !== 'CARD_REPLACED_PRIVATE') return
  if (!context.privateGameState || !context.privateGameState.hand) return
  
  const payload = (event as CardReplacedPrivateEvent).payload
  if (context.privateGameState.playerId !== payload.playerId) return
  
  // Remove the old card and add the new card
  context.privateGameState.hand = context.privateGameState.hand.filter(
    card => card.id !== payload.cardToReplace.id
  )
  context.privateGameState.hand.push(payload.replacementCard)
  
  audioService.playSoundEffect('replaceCard')
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
  
  console.log(`🎯 TRICK_STARTED: Trick ${payload.trickNumber}, Lead: ${payload.leadPlayer}`)
}

const handleCardPlayed: GameEventHandler = (event, context) => {
  if (event.type !== 'CARD_PLAYED') return
  if (!context.publicGameState || !context.publicGameState.round.currentTrick) return
  
  const payload = (event as CardPlayedEvent).payload
  
  // Agregar la carta jugada al mapa de cartas públicas
  context.publicGameState.publicCards[payload.card.id] = payload.card
  
  // Agregar la carta al trick actual
  context.publicGameState.round.currentTrick.cards.push(payload.card.id)

  const playedCardOwnerInfo = context.publicGameState.opponentsPublicInfo.find(
    info => info.playerId === payload.playerId
  )
  if (playedCardOwnerInfo) {
    playedCardOwnerInfo.handCardsCount = Math.max(0, playedCardOwnerInfo.handCardsCount - 1)
  }
  
  // Determinar lead_suit si es la primera carta del trick
  if (context.publicGameState.round.currentTrick.cards.length === 1 && 
      !context.publicGameState.round.currentTrick.lead_suit) {
    // El lead_suit es el suit de la primera carta, excepto si es 'flowers' (que no puede ser lead suit)
    const cardSuit = payload.card.suit
    if (cardSuit !== 'flowers') {
      context.publicGameState.round.currentTrick.lead_suit = cardSuit as 'acorns' | 'leaves' | 'berries'
    }
  }
  
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

  // Lógica de sonido específico por carta
  if (payload.card.suit === 'berries' && payload.card.char === 'S') {
    audioService.playSoundEffect('berriesS');
  } else if (payload.card.suit === 'leaves' && payload.card.char === 'S') {
    audioService.playSoundEffect('leavesS');
  } else if (payload.card.suit === 'acorns' && payload.card.char === 'S') {
    audioService.playSoundEffect('acornsS');
  } else {
    // Para todas las demás cartas, usar el sonido normal
    audioService.playSoundEffect('playCard');
  }
  
  console.log(`🃏 CARD_PLAYED: ${payload.card.char}${payload.card.suit} by ${payload.playerId}`)
}

const handleTrickCompleted: GameEventHandler = (event, context) => {
  if (event.type !== 'TRICK_COMPLETED') return
  if (!context.publicGameState || !context.publicGameState.round.currentTrick) return
  
  const payload = (event as TrickCompletedEvent).payload
  const currentTrick = context.publicGameState.round.currentTrick
  
  // Actualizar el trick con el ganador y score
  currentTrick.score.trick_winner = payload.winner
  currentTrick.score.trick_points = payload.points
  currentTrick.score.trick_collections = payload.collections
  currentTrick.trick_state = 'resolve'
  
  // Actualizar cards del trick (sin carta robada si aplica)
  currentTrick.cards = payload.cards.map(c => c.id)
  
  // Actualizar roundScore del ganador
  let playerScore = context.publicGameState.round.roundScore.find(
    s => s.playerId === payload.winner
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
  
  // Actualizar roundScore del ladrón si existe
  if (payload.stolenCardInfo) {
    let thiefScore = context.publicGameState.round.roundScore.find(
      s => s.playerId === payload.stolenCardInfo!.thiefId
    )
    
    if (!thiefScore) {
      thiefScore = {
        playerId: payload.stolenCardInfo.thiefId,
        points: 0,
        tricksWon: [],
        setCollection: { acorns: 0, leaves: 0, berries: 0, flowers: 0 }
      }
      context.publicGameState.round.roundScore.push(thiefScore)
    }
    
    thiefScore.points += payload.stolenCardInfo.points
    // NO agregar a tricksWon (el ladrón no gana el trick)
    if (payload.stolenCardInfo.collections) {
      thiefScore.setCollection.acorns += payload.stolenCardInfo.collections.acorns || 0
      thiefScore.setCollection.leaves += payload.stolenCardInfo.collections.leaves || 0
      thiefScore.setCollection.berries += payload.stolenCardInfo.collections.berries || 0
      thiefScore.setCollection.flowers += payload.stolenCardInfo.collections.flowers || 0
    }
  }
  
  audioService.playSoundEffect('trickWon')
  
  console.log(`🏆 TRICK_COMPLETED: Trick ${payload.trickNumber}, Winner: ${payload.winner}`)
}

const handleRoundEnded: GameEventHandler = (event, context) => {
  if (event.type !== 'ROUND_ENDED') return
  if (!context.publicGameState) return
  
  const payload = (event as RoundEndedEvent).payload
  
  // Update round phase to scoring
  context.publicGameState.round.roundPhase = 'scoring'
  
  // Update accumulated player scores if provided
  if (payload.playerScores) {
    context.publicGameState.playerScores = payload.playerScores
  }
  
  console.log(`🏁 ROUND_ENDED: Round ${payload.round}`)
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
  
  audioService.playSoundEffect('makeBid')
  
  console.log(`🎯 BID_MADE: ${payload.bidType} by ${payload.playerId}`)
}

const handleTurnFinished: GameEventHandler = (event, context) => {
  if (event.type !== 'TURN_FINISHED') return
  if (!context.publicGameState) return
  
  const payload = (event as TurnFinishedEvent).payload
  context.publicGameState.round.playerTurn = payload.nextPlayer
  
  console.log(`🔄 TURN_FINISHED: ${payload.playerId} → ${payload.nextPlayer}`)
}

const handleTrickFinished: GameEventHandler = (event, context) => {
  if (event.type !== 'TRICK_FINISHED') return
  if (!context.publicGameState) return
  
  const payload = (event as TrickFinishedEvent).payload
  
  // Clear current trick (moved to history)
  context.publicGameState.round.currentTrick = null
  
  console.log(`✅ TRICK_FINISHED: Trick ${payload.trickNumber}`)
}

const handleCardReplacementSkipped: GameEventHandler = (event, context) => {
  if (event.type !== 'CARD_REPLACEMENT_SKIPPED') return
  if (!context.publicGameState) return
  
  const payload = (event as CardReplacementSkippedEvent).payload
  context.publicGameState.round.playerTurn = payload.nextPlayerId

  const hasPlayerScore = context.publicGameState.playerScores.some(
    score => score.playerId === payload.playerId
  )

  context.publicGameState.playerScores = hasPlayerScore
    ? context.publicGameState.playerScores.map(score =>
        score.playerId === payload.playerId
          ? { ...score, score: payload.playerGameScore }
          : score
      )
    : [
        ...context.publicGameState.playerScores,
        {
          playerId: payload.playerId,
          score: payload.playerGameScore
        }
      ]
  
  console.log(`⏭️ CARD_REPLACEMENT_SKIPPED: ${payload.playerId}`)
}

const handleCardReplacementCompleted: GameEventHandler = (event, context) => {
  if (event.type !== 'CARD_REPLACEMENT_COMPLETED') return
  if (!context.publicGameState) return
  
  const payload = (event as CardReplacementCompletedEvent).payload
  context.publicGameState.round.playerTurn = payload.nextPlayerId
  
  console.log(`🔄 CARD_REPLACEMENT_COMPLETED: ${payload.playerId}`)
}

const handlePickNextLead: GameEventHandler = (event, context) => {
  if (event.type !== 'PICK_NEXT_LEAD') return
  if (!context.publicGameState || !context.publicGameState.round.currentTrick) return
  
  const payload = (event as PickNextLeadEvent).payload
  
  // Actualizar el trick state a awaiting_special_action
  context.publicGameState.round.currentTrick.trick_state = 'awaiting_special_action'
  context.publicGameState.round.currentTrick.pendingSpecialAction = {
    type: 'PICK_NEXT_LEAD',
    playerId: payload.playerId
  }
  
  // Mantener el turno en el jugador que debe seleccionar
  context.publicGameState.round.playerTurn = payload.playerId
  
  console.log(`🫐 PICK_NEXT_LEAD: ${payload.playerId}`)
}

const handleNextLeadPlayerSelected: GameEventHandler = (event, context) => {
  if (event.type !== 'NEXT_LEAD_PLAYER_SELECTED') return
  if (!context.publicGameState || !context.publicGameState.round.currentTrick) return
  
  const payload = (event as NextLeadPlayerSelectedEvent).payload
  
  // Actualizar la acción especial pendiente
  if (context.publicGameState.round.currentTrick.pendingSpecialAction) {
    context.publicGameState.round.currentTrick.pendingSpecialAction.selectedNextLead = payload.selectedLeadPlayer
  }
  
  // Cambiar el trick state a resolve
  context.publicGameState.round.currentTrick.trick_state = 'resolve'
  
  console.log(`🫐 NEXT_LEAD_SELECTED: ${payload.selectedLeadPlayer}`)
}

const handlePickCardFromTrick: GameEventHandler = (event, context) => {
  if (event.type !== 'PICK_CARD_FROM_TRICK') return
  if (!context.publicGameState || !context.publicGameState.round.currentTrick) return
  
  const payload = (event as PickCardFromTrickEvent).payload
  
  // Actualizar el trick state a awaiting_special_action
  context.publicGameState.round.currentTrick.trick_state = 'awaiting_special_action'
  context.publicGameState.round.currentTrick.pendingSpecialAction = {
    type: 'STEAL_CARD',
    playerId: payload.playerId
  }
  
  // Mantener el turno en el jugador que debe seleccionar
  context.publicGameState.round.playerTurn = payload.playerId
  
  console.log(`🍃 PICK_CARD_FROM_TRICK: ${payload.playerId}`)
}

const handleCardStolenFromTrick: GameEventHandler = (event, context) => {
  if (event.type !== 'CARD_STOLEN_FROM_TRICK') return
  if (!context.publicGameState || !context.publicGameState.round.currentTrick) return
  
  const payload = (event as CardStolenFromTrickEvent).payload
  
  // Actualizar la acción especial pendiente
  if (context.publicGameState.round.currentTrick.pendingSpecialAction) {
    context.publicGameState.round.currentTrick.pendingSpecialAction.selectedCardToSteal = payload.stolenCardId
  }
  
  // Cambiar el trick state a resolve
  context.publicGameState.round.currentTrick.trick_state = 'resolve'
  
  console.log(`🍃 CARD_STOLEN: ${payload.stolenCardId}`)
}

const handleGameEnded: GameEventHandler = (event, context) => {
  if (event.type !== 'GAME_ENDED') return
  if (!context.publicGameState) return
  
  const payload = (event as GameEndedEvent).payload
  
  context.publicGameState.gamePhase = 'ended'
  context.publicGameState.winner = payload.winnerId
  context.publicGameState.playerScores = payload.finalScores
  
  console.log(`🏆 GAME_ENDED: Winner ${payload.winnerName}`)
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
  'PICK_NEXT_LEAD': handlePickNextLead,
  'NEXT_LEAD_PLAYER_SELECTED': handleNextLeadPlayerSelected,
  'PICK_CARD_FROM_TRICK': handlePickCardFromTrick,
  'CARD_STOLEN_FROM_TRICK': handleCardStolenFromTrick,
  'GAME_ENDED': handleGameEnded,
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
