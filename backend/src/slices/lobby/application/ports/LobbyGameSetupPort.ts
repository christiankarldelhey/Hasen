import type { PlayerId, ActivePlayer } from '@domain/interfaces'

export interface LobbyGameBidDecksSnapshot {
  setCollectionBidDeck: unknown[]
  pointsBidDeck: unknown[]
  tricksBidDeck: unknown[]
}

export interface LobbyGameSettingsSnapshot {
  minPlayers: number
  maxPlayers: number
  pointsToWin: number
}

export interface LobbyGameSnapshot {
  gameId: string
  gameName: string
  hostPlayer: PlayerId
  activePlayers: ActivePlayer[]
  gamePhase: string
  deckSize: number
  bidDecks: LobbyGameBidDecksSnapshot
  gameSettings: LobbyGameSettingsSnapshot
  createdAt: Date
}

export interface LobbyStartedGameSnapshot {
  gameId: string
  gamePhase: string
  activePlayers: ActivePlayer[]
  playerTurnOrder: PlayerId[]
}

export interface LobbyOpenGameSnapshot {
  gameId: string
  gameName: string
  hostPlayer: PlayerId
  activePlayers: ActivePlayer[]
  gameSettings: LobbyGameSettingsSnapshot
  createdAt: Date
}

export interface LobbyJoinedGameSnapshot {
  gameId: string
  activePlayers: ActivePlayer[]
  gameSettings: LobbyGameSettingsSnapshot
}

export interface LobbyGameSetupPort {
  createGame(
    gameName: string | undefined,
    hostPlayerId: PlayerId,
    userId: string,
    maxPlayers?: number,
    pointsToWin?: number
  ): Promise<{ gameId: string }>

  updatePlayerProfile(
    gameId: string,
    playerId: PlayerId,
    updates: { name?: string; color?: string }
  ): Promise<void>

  updatePointsToWin(gameId: string, hostPlayerId: PlayerId, pointsToWin: number): Promise<void>

  getAssignedPlayerId(gameId: string, userId: string): Promise<PlayerId | null>

  findGameById(gameId: string): Promise<LobbyGameSnapshot | null>

  listOpenGames(): Promise<LobbyOpenGameSnapshot[]>

  joinGame(gameId: string, userId: string): Promise<{ game: LobbyJoinedGameSnapshot; assignedPlayerId: PlayerId }>

  leaveGame(gameId: string, playerId: PlayerId, userId: string): Promise<{ currentPlayers: number }>

  deleteGame(gameId: string): Promise<void>

  startGame(gameId: string): Promise<{ game: LobbyStartedGameSnapshot; event: unknown }>

  startNewRound(gameId: string): Promise<{ setupEvent: unknown; firstCardsEvent: unknown; privateCards: Map<PlayerId, unknown[]> }>
}
