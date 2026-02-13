import { Server } from 'socket.io'
import type { PlayerId, PlayingCard } from '@domain/interfaces'
import { createRemainingCardsDealtEvent } from '@domain/events/GameEvents.js'
import { GameService } from '@/services/GameService.js'
import { socketToPlayer } from './lobbyHandlers.js'

export function getPlayerSocketId(gameId: string, playerId: PlayerId): string | undefined {
  return Array.from(socketToPlayer.entries())
    .find(([_, data]) => data.gameId === gameId && data.playerId === playerId)?.[0]
}

export function emitPrivateCards(
  io: Server,
  gameId: string,
  privateCards: Map<PlayerId, PlayingCard[]>
): void {
  for (const [playerId, cards] of privateCards) {
    const privateEvent = createRemainingCardsDealtEvent(playerId, cards)
    const playerSocketId = getPlayerSocketId(gameId, playerId)

    if (playerSocketId) {
      io.to(playerSocketId).emit('game:event', privateEvent)
    } else {
      console.warn(`Socket not found for player ${playerId}`)
    }
  }
}

export async function emitFullStateToGamePlayers(io: Server, gameId: string): Promise<void> {
  for (const [socketId, data] of socketToPlayer.entries()) {
    if (data.gameId !== gameId) continue

    const { publicState, privateState } = await GameService.getPlayerGameState(gameId, data.userId)
    io.to(socketId).emit('game:stateUpdate', {
      publicGameState: publicState,
      privateGameState: privateState
    })
  }
}
