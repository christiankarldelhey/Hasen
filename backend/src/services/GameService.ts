import { GameModel } from '../models/Game'
import { PlayerId, PlayingCard, Trick, TrickNumber } from '../../../domain/interfaces'
import { canPlayCard } from '../../../domain/rules/CardRules'
import { determineLeadSuit, determineTrickWinner } from '../../../domain/rules/TrickRules'

export class GameService {
  /**
   * Procesa el juego de una carta y actualiza el estado del juego
   */
  static async playCard(
    gameId: string,
    playerId: PlayerId,
    cardId: string
  ): Promise<{
    success: boolean
    error?: string
    updatedGame?: any
    card?: PlayingCard
    nextPlayerId?: PlayerId | null
    trickCompleted?: boolean
    trickWinner?: PlayerId
  }> {
    // 1. Obtener el juego de la BD
    const game = await GameModel.findOne({ gameId })
    if (!game) {
      return { success: false, error: 'Juego no encontrado' }
    }

    // 2. Verificar que es el turno del jugador
    if (game.round.playerTurn !== playerId) {
      return { success: false, error: 'No es tu turno' }
    }

    // 3. Verificar que estamos en fase de juego
    if (game.round.roundPhase !== 'playing') {
      return { success: false, error: 'No estamos en fase de juego' }
    }

    // 4. Verificar que hay un trick activo
    if (!game.round.currentTrick) {
      return { success: false, error: 'No hay trick activo' }
    }

    // 5. Encontrar la carta en el deck
    const card = game.deck.find(c => c.id === cardId)
    if (!card) {
      return { success: false, error: 'Carta no encontrada' }
    }

    // 6. Obtener la mano del jugador
    const playerHand = game.deck.filter(
      c => c.owner === playerId && c.state === 'in_hand'
    )

// 7. Validar con CardRules
const validation = canPlayCard(
  card,
  playerId,
  game.round.playerTurn,  // ✅ Agregar playerTurn
  playerHand,
  game.round.currentTrick
)

if (!validation.valid) {
  return { success: false, error: validation.reason }
}

// 8. Actualizar el estado de la carta
card.state = 'in_trick'

// 9. Agregar la carta al trick (por ID)
game.round.currentTrick.cards.push(card.id)

// 10. Si es la primera carta, establecer lead_suit y lead_player
if (game.round.currentTrick.cards.length === 1) {
  game.round.currentTrick.lead_suit = determineLeadSuit(card)
  game.round.currentTrick.lead_player = playerId
}

// 11. Determinar el siguiente jugador
const currentPlayerIndex = game.playerTurnOrder.indexOf(playerId)
const nextPlayerIndex = (currentPlayerIndex + 1) % game.playerTurnOrder.length
const nextPlayerId = game.playerTurnOrder[nextPlayerIndex]

// 12. Verificar si el trick está completo
const trickCompleted = game.round.currentTrick.cards.length === game.activePlayers.length
let trickWinner: PlayerId | undefined

if (trickCompleted) {
  // Cambiar estado a 'resolve' antes de determinar ganador
  game.round.currentTrick.trick_state = 'resolve'
  
  // Determinar ganador usando TrickRules
  trickWinner = determineTrickWinner(game.round.currentTrick, game.deck)
  game.round.currentTrick.winner = trickWinner
  game.round.currentTrick.winning_card = card.id
  game.round.currentTrick.trick_state = 'ended'

  // Actualizar estado de las cartas del trick
  game.round.currentTrick.cards.forEach(cardId => {
    const trickCard = game.deck.find(c => c.id === cardId)
    if (trickCard) {
      trickCard.state = 'in_finished_trick'
    }
  })

  // Mover el trick al historial
  game.tricksHistory.push(game.round.currentTrick)

  // El ganador del trick es el siguiente en jugar
  game.round.playerTurn = trickWinner
  game.round.currentTrick = null
} else {
  // Actualizar turno al siguiente jugador
  game.round.playerTurn = nextPlayerId
}

// 13. Guardar el estado en la BD
await game.save()

return {
  success: true,
  updatedGame: game,
  card,
  nextPlayerId: trickCompleted ? trickWinner : nextPlayerId,
  trickCompleted,
  trickWinner
}

  /**
   * Crea un nuevo trick
   */
  static async startNewTrick(gameId: string): Promise<Trick> {
    const game = await GameModel.findOne({ gameId })
    if (!game) {
      throw new Error('Juego no encontrado')
    }

    const trickNumber = (game.tricksHistory.length + 1) as TrickNumber

    const newTrick: Trick = {
      trick_id: Date.now(),
      trick_state: 'in_progress',
      trick_number: trickNumber,
      lead_player: game.round.playerTurn,
      winning_card: null,
      winner: null,
      lead_suit: null,
      cards: []
    }

    game.round.currentTrick = newTrick
    await game.save()

    return newTrick
  }
}