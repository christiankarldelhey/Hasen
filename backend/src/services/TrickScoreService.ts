import type { PlayerId, TrickNumber, PlayingCard, TrickScore } from '@domain/interfaces'
import { scoreCardsInTrick } from '@domain/rules/TrickRules.js'

/**
 * Servicio para centralizar el cálculo y actualización de scores de tricks
 * Maneja la lógica de Trick → Round Score (game.round.roundScore)
 */
export class TrickScoreService {
  /**
   * Calcula el score de las cartas usando la función domain y actualiza el roundScore del jugador
   */
  static calculateAndUpdateTrickScore(
    game: any,
    playerId: PlayerId,
    cards: PlayingCard[],
    trickNumber: TrickNumber,
    addTrickToWon: boolean = true
  ): TrickScore {
    // Calcular score usando la función domain
    const trickScore = scoreCardsInTrick(cards)

    // Inicializar roundScore si no existe
    if (!game.round.roundScore) {
      game.round.roundScore = []
    }

    // Buscar el índice del score del jugador en round.roundScore
    const playerScoreIndex = game.round.roundScore.findIndex((ps: any) => ps.playerId === playerId)

    if (playerScoreIndex === -1) {
      // Crear nuevo score para el jugador si no existe
      game.round.roundScore.push({
        playerId: playerId,
        points: trickScore.trick_points,
        tricksWon: addTrickToWon ? [trickNumber] : [],
        setCollection: {
          acorns: trickScore.trick_collections?.acorns || 0,
          leaves: trickScore.trick_collections?.leaves || 0,
          berries: trickScore.trick_collections?.berries || 0,
          flowers: trickScore.trick_collections?.flowers || 0
        }
      })
    } else {
      // Actualizar score existente
      const playerScore = game.round.roundScore[playerScoreIndex]

      // Agregar el número del trick ganado solo si addTrickToWon es true
      if (addTrickToWon) {
        playerScore.tricksWon.push(trickNumber)
      }

      // Sumar los puntos
      playerScore.points += trickScore.trick_points

      // Sumar las colecciones de suits
      if (trickScore.trick_collections) {
        playerScore.setCollection.acorns += trickScore.trick_collections.acorns || 0
        playerScore.setCollection.leaves += trickScore.trick_collections.leaves || 0
        playerScore.setCollection.berries += trickScore.trick_collections.berries || 0
        playerScore.setCollection.flowers += trickScore.trick_collections.flowers || 0
      }
    }

    // Marcar el array como modificado para que Mongoose persista los cambios
    game.markModified('round.roundScore')

    const playerScore = game.round.roundScore.find((ps: any) => ps.playerId === playerId)
    console.log(`📊 Updated score for ${playerId}: ${playerScore.points} points, ${playerScore.tricksWon.length} tricks won`)

    return trickScore
  }

  /**
   * Calcula el score de las cartas sin actualizar el estado del juego
   * Útil para validaciones o cálculos temporales
   */
  static calculateTrickScore(cards: PlayingCard[]): TrickScore {
    return scoreCardsInTrick(cards)
  }
}
