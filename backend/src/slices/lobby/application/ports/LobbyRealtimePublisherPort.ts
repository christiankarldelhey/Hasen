import type { ActivePlayer, PlayerId } from '@domain/interfaces'

export interface LobbyRoomCreatedPayload {
  gameId: string
  gameName: string
  hostPlayer: PlayerId
  activePlayers: ActivePlayer[]
  currentPlayers: number
  maxPlayers: number
  minPlayers: number
  hasSpace: boolean
  pointsToWin: number
  createdAt: Date
}

export interface LobbyRealtimePublisherPort {
  publishLobbyRoomCreated(payload: LobbyRoomCreatedPayload): void
  publishLobbyPlayerCountChanged(gameId: string, currentPlayers: number): void
  publishGameStarted(payload: {
    gameId: string
    gamePhase: string
    activePlayers: PlayerId[]
    playerTurnOrder: PlayerId[]
  }): void
  publishGameEvent(gameId: string, event: unknown): void
  publishRoundSetup(gameId: string, setupEvent: unknown, firstCardsEvent: unknown, privateCards: Map<PlayerId, unknown[]>): void
  publishGameStateSync(gameId: string): Promise<void>
}
