import type { Server } from 'socket.io'
import { GameSocketPublisher } from '@/socket/services/gameSocketPublisher.js'
import type { PlayerId } from '@domain/interfaces'
import type {
  LobbyRealtimePublisherPort,
  LobbyRoomCreatedPayload
} from '../../application/ports/LobbyRealtimePublisherPort.js'

export class SocketLobbyRealtimePublisher implements LobbyRealtimePublisherPort {
  constructor(private readonly io: Server) {}

  publishLobbyRoomCreated(payload: LobbyRoomCreatedPayload): void {
    GameSocketPublisher.publishLobbyRoomCreated(this.io, payload)
  }

  publishLobbyPlayerCountChanged(gameId: string, currentPlayers: number): void {
    GameSocketPublisher.publishLobbyPlayerCountChanged(this.io, gameId, currentPlayers)
  }

  publishGameStarted(payload: {
    gameId: string
    gamePhase: string
    activePlayers: PlayerId[]
    playerTurnOrder: PlayerId[]
  }): void {
    GameSocketPublisher.publishGameStarted(this.io, payload)
  }

  publishGameEvent(gameId: string, event: unknown): void {
    GameSocketPublisher.publishGameEvent(this.io, gameId, event)
  }

  publishRoundSetup(
    gameId: string,
    setupEvent: unknown,
    firstCardsEvent: unknown,
    privateCards: Map<PlayerId, unknown[]>
  ): void {
    GameSocketPublisher.publishRoundSetup(this.io, gameId, setupEvent, firstCardsEvent, privateCards as Map<PlayerId, import('@domain/interfaces').PlayingCard[]>)
  }

  async publishGameStateSync(gameId: string): Promise<void> {
    await GameSocketPublisher.publishGameStateSync(this.io, gameId)
  }
}
