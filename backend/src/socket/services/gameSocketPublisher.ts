import type { Server } from 'socket.io'
import type { PlayerId, PlayingCard } from '@domain/interfaces'
import { emitFullStateToGamePlayers, emitPrivateCards } from '../handlers/roundHandlers.helpers.js'

interface LobbyRoomCreatedPayload {
  gameId: string
  gameName: string
  hostPlayer: PlayerId
  currentPlayers: number
  maxPlayers: number
  minPlayers: number
  hasSpace: boolean
  pointsToWin: number
  createdAt: Date
}

interface GameStartedPayload {
  gameId: string
  gamePhase: string
  activePlayers: PlayerId[]
  playerTurnOrder: PlayerId[]
}

export class GameSocketPublisher {
  static publishLobbyRoomCreated(io: Server, payload: LobbyRoomCreatedPayload): void {
    io.to('lobby-list').emit('lobby:room-created', payload)
  }

  static publishLobbyPlayerCountChanged(io: Server, gameId: string, currentPlayers: number): void {
    io.to('lobby-list').emit('lobby:player-count-changed', {
      gameId,
      currentPlayers
    })
  }

  static publishGameStarted(io: Server, payload: GameStartedPayload): void {
    io.to(payload.gameId).emit('game:started', payload)
  }

  static publishGameEvent(io: Server, gameId: string, event: unknown): void {
    io.to(gameId).emit('game:event', event)
  }

  static publishRoundSetup(
    io: Server,
    gameId: string,
    setupEvent: unknown,
    firstCardsEvent: unknown,
    privateCards: Map<PlayerId, PlayingCard[]>
  ): void {
    this.publishGameEvent(io, gameId, setupEvent)
    this.publishGameEvent(io, gameId, firstCardsEvent)
    emitPrivateCards(io, gameId, privateCards)
  }

  static async publishGameStateSync(io: Server, gameId: string): Promise<void> {
    await emitFullStateToGamePlayers(io, gameId)
  }
}
