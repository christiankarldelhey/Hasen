import type { Server } from 'socket.io'
import { CreateGameUseCase } from '@/slices/lobby/application/use-cases/CreateGameUseCase.js'
import { GetOpenGamesUseCase } from '@/slices/lobby/application/use-cases/GetOpenGamesUseCase.js'
import { JoinGameUseCase } from '@/slices/lobby/application/use-cases/JoinGameUseCase.js'
import { UpdatePlayerProfileUseCase } from '@/slices/lobby/application/use-cases/UpdatePlayerProfileUseCase.js'
import { UpdateGameSettingsUseCase } from '@/slices/lobby/application/use-cases/UpdateGameSettingsUseCase.js'
import { StartGameUseCase } from '@/slices/lobby/application/use-cases/StartGameUseCase.js'
import { DeleteGameUseCase } from '@/slices/lobby/application/use-cases/DeleteGameUseCase.js'
import { LeaveLobbyUseCase } from '@/slices/lobby/application/use-cases/LeaveLobbyUseCase.js'
import { LeaveMatchUseCase } from '@/slices/connection-lifecycle/application/use-cases/LeaveMatchUseCase.js'
import { HandleDisconnectionTimeoutUseCase } from '@/slices/connection-lifecycle/application/use-cases/HandleDisconnectionTimeoutUseCase.js'
import { HandleSocketDisconnectUseCase } from '@/slices/connection-lifecycle/application/use-cases/HandleSocketDisconnectUseCase.js'
import { RegisterPlayerUseCase } from '@/slices/connection-lifecycle/application/use-cases/RegisterPlayerUseCase.js'
import { HandlePlayerReconnectedUseCase } from '@/slices/connection-lifecycle/application/use-cases/HandlePlayerReconnectedUseCase.js'
import { GetPlayerGameStateUseCase } from '@/slices/connection-lifecycle/application/use-cases/GetPlayerGameStateUseCase.js'
import { EndGameUseCase } from '@/slices/scoring-game-end/application/use-cases/EndGameUseCase.js'
import { StartRoundUseCase } from '@/slices/round-setup/application/use-cases/StartRoundUseCase.js'
import { ReadyForNextRoundUseCase } from '@/slices/round-setup/application/use-cases/ReadyForNextRoundUseCase.js'
import { LegacyLobbyGameSetupAdapter } from '@/slices/lobby/infrastructure/persistence/LegacyLobbyGameSetupAdapter.js'
import { SocketLobbyRealtimePublisher } from '@/slices/lobby/infrastructure/realtime/SocketLobbyRealtimePublisher.js'
import { LegacyConnectionGameAdapter } from '@/slices/connection-lifecycle/infrastructure/persistence/LegacyConnectionGameAdapter.js'
import { SocketConnectionRealtimePublisher } from '@/slices/connection-lifecycle/infrastructure/realtime/SocketConnectionRealtimePublisher.js'
import { LegacyScoringGameAdapter } from '@/slices/scoring-game-end/infrastructure/persistence/LegacyScoringGameAdapter.js'
import { LegacyRoundSetupAdapter } from '@/slices/round-setup/infrastructure/persistence/LegacyRoundSetupAdapter.js'

export interface CompositionRoot {
  lobby: {
    createGameUseCase: CreateGameUseCase
    getOpenGamesUseCase: GetOpenGamesUseCase
    joinGameUseCase: JoinGameUseCase
    updatePlayerProfileUseCase: UpdatePlayerProfileUseCase
    updateGameSettingsUseCase: UpdateGameSettingsUseCase
    startGameUseCase: StartGameUseCase
    deleteGameUseCase: DeleteGameUseCase
    leaveLobbyUseCase: LeaveLobbyUseCase
  }
  connectionLifecycle: {
    leaveMatchUseCase: LeaveMatchUseCase
    handleDisconnectionTimeoutUseCase: HandleDisconnectionTimeoutUseCase
    handleSocketDisconnectUseCase: HandleSocketDisconnectUseCase
    registerPlayerUseCase: RegisterPlayerUseCase
    handlePlayerReconnectedUseCase: HandlePlayerReconnectedUseCase
    getPlayerGameStateUseCase: GetPlayerGameStateUseCase
  }
  scoringGameEnd: {
    endGameUseCase: EndGameUseCase
  }
  roundSetup: {
    startRoundUseCase: StartRoundUseCase
    readyForNextRoundUseCase: ReadyForNextRoundUseCase
  }
}

export function createCompositionRoot(io: Server): CompositionRoot {
  const lobbyGameSetup = new LegacyLobbyGameSetupAdapter()
  const lobbyRealtimePublisher = new SocketLobbyRealtimePublisher(io)
  const connectionGamePort = new LegacyConnectionGameAdapter()
  const connectionRealtimePublisher = new SocketConnectionRealtimePublisher(io)
  const scoringGamePort = new LegacyScoringGameAdapter()
  const roundSetupPort = new LegacyRoundSetupAdapter()

  return {
    lobby: {
      createGameUseCase: new CreateGameUseCase(lobbyGameSetup, lobbyRealtimePublisher),
      getOpenGamesUseCase: new GetOpenGamesUseCase(lobbyGameSetup),
      joinGameUseCase: new JoinGameUseCase(lobbyGameSetup, lobbyRealtimePublisher),
      updatePlayerProfileUseCase: new UpdatePlayerProfileUseCase(lobbyGameSetup, lobbyRealtimePublisher),
      updateGameSettingsUseCase: new UpdateGameSettingsUseCase(lobbyGameSetup, lobbyRealtimePublisher),
      startGameUseCase: new StartGameUseCase(lobbyGameSetup, lobbyRealtimePublisher),
      deleteGameUseCase: new DeleteGameUseCase(lobbyGameSetup),
      leaveLobbyUseCase: new LeaveLobbyUseCase(lobbyGameSetup)
    },
    connectionLifecycle: {
      leaveMatchUseCase: new LeaveMatchUseCase(connectionGamePort, connectionRealtimePublisher),
      handleDisconnectionTimeoutUseCase: new HandleDisconnectionTimeoutUseCase(connectionGamePort, connectionRealtimePublisher),
      handleSocketDisconnectUseCase: new HandleSocketDisconnectUseCase(connectionGamePort),
      registerPlayerUseCase: new RegisterPlayerUseCase(connectionGamePort),
      handlePlayerReconnectedUseCase: new HandlePlayerReconnectedUseCase(connectionGamePort),
      getPlayerGameStateUseCase: new GetPlayerGameStateUseCase(connectionGamePort)
    },
    scoringGameEnd: {
      endGameUseCase: new EndGameUseCase(scoringGamePort)
    },
    roundSetup: {
      startRoundUseCase: new StartRoundUseCase(roundSetupPort),
      readyForNextRoundUseCase: new ReadyForNextRoundUseCase(roundSetupPort)
    }
  }
}
