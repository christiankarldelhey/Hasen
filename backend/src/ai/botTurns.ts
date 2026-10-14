import type { Game, PlayerId } from '@domain/interfaces'

function isBotPlayer(game: Game, playerId: PlayerId): boolean {
  return game.activePlayers.some(player => player.id === playerId && player.isBot)
}

export function getBotToAct(game: Game): PlayerId | null {
  if (game.round.roundPhase === 'player_drawing' && game.round.playerTurn && isBotPlayer(game, game.round.playerTurn)) {
    return game.round.playerTurn
  }

  const trick = game.round.currentTrick
  if (trick?.trick_state === 'awaiting_special_action' && trick.pendingSpecialAction?.playerId) {
    return isBotPlayer(game, trick.pendingSpecialAction.playerId) ? trick.pendingSpecialAction.playerId : null
  }

  if (trick?.trick_state === 'resolve') {
    const trickWinner = trick.score?.trick_winner
    if (trickWinner && isBotPlayer(game, trickWinner)) {
      return trickWinner
    }
    return null
  }

  if (game.round.roundPhase === 'playing' && game.round.playerTurn && isBotPlayer(game, game.round.playerTurn)) {
    return game.round.playerTurn
  }

  if (game.round.roundPhase === 'scoring') {
    const readyPlayers = game.round.playersReadyForNextRound || []
    const botWaiting = game.activePlayers.find(player => player.isBot && !readyPlayers.includes(player.id))
    return botWaiting?.id ?? null
  }

  return null
}
