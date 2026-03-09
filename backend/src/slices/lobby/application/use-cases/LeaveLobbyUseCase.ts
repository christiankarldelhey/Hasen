import type { PlayerId } from '@domain/interfaces'
import type { LobbyGameSetupPort } from '../ports/LobbyGameSetupPort.js'

interface LeaveLobbyInput {
  gameId: string
  playerId: PlayerId
  userId: string
}

interface LeaveLobbyOutput {
  currentPlayers: number
}

export class LeaveLobbyUseCase {
  constructor(private readonly gameSetupPort: LobbyGameSetupPort) {}

  async execute(input: LeaveLobbyInput): Promise<LeaveLobbyOutput> {
    const result = await this.gameSetupPort.leaveGame(input.gameId, input.playerId, input.userId)
    return { currentPlayers: result.currentPlayers }
  }
}
