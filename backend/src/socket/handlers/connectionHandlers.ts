import { Server, Socket } from 'socket.io'
import { GameService } from '../../services/GameService.js'
import { socketToPlayer } from './lobbyHandlers.js'
import { GameModel } from '../../models/Game.js'
import { PlayerId } from '@domain/interfaces/Player.js'

const disconnectionTimers = new Map<string, NodeJS.Timeout>()

const getDisconnectionTimerKey = (gameId: string, playerId: PlayerId) => `${gameId}:${playerId}`

export function clearDisconnectionTimeout(gameId: string, playerId: PlayerId) {
  const key = getDisconnectionTimerKey(gameId, playerId)
  const timer = disconnectionTimers.get(key)
  if (!timer) {
    return
  }

  clearTimeout(timer)
  disconnectionTimers.delete(key)
}

function scheduleDisconnectionTimeout(io: Server, gameId: string, playerId: PlayerId, timeoutMs: number) {
  clearDisconnectionTimeout(gameId, playerId)

  const key = getDisconnectionTimerKey(gameId, playerId)
  const timer = setTimeout(async () => {
    try {
      const { timedOutPlayers } = await GameService.checkDisconnectionTimeouts(gameId)
      if (!timedOutPlayers.includes(playerId)) {
        disconnectionTimers.delete(key)
        return
      }

      const result = await GameService.interruptGame(gameId, 'player_disconnect_timeout', playerId)
      if (!result.interrupted) {
        disconnectionTimers.delete(key)
        return
      }

      io.to(gameId).emit('game:interrupted', {
        reason: 'player_disconnect_timeout',
        playerId,
      })

      const updatedState = await GameService.getPlayerGameState(gameId)
      io.to(gameId).emit('game:stateUpdate', {
        publicGameState: updatedState.publicState,
      })
    } catch (error) {
      console.error('Error in disconnection timeout handler:', error)
    } finally {
      disconnectionTimers.delete(key)
    }
  }, timeoutMs)

  disconnectionTimers.set(key, timer)
}

export function setupConnectionHandlers(io: Server, socket: Socket) {

socket.on('game:leave-match', async ({ gameId, playerId, userId }: { gameId: string; playerId: PlayerId; userId: string }) => {
  try {
    console.log(`🚪 Player ${playerId} left active match ${gameId}`)

    socket.leave(gameId)
    socketToPlayer.delete(socket.id)
    clearDisconnectionTimeout(gameId, playerId)

    const result = await GameService.interruptGame(gameId, 'player_left_game', playerId)
    if (!result.interrupted) {
      return
    }

    io.to(gameId).emit('game:interrupted', {
      reason: 'player_left_game',
      playerId,
      userId
    })

    const updatedState = await GameService.getPlayerGameState(gameId)
    io.to(gameId).emit('game:stateUpdate', {
      publicGameState: updatedState.publicState
    })
  } catch (error) {
    console.error('Error handling game:leave-match:', error)
  }
})
  
socket.on('disconnect', async () => {
  console.log(`❌ Client disconnected: ${socket.id}`)
  
  const playerInfo = socketToPlayer.get(socket.id)
  if (playerInfo) {
    const { gameId, playerId, userId } = playerInfo
    
    try {
      const game = await GameModel.findOne({ gameId })
      
      if (!game) {
        console.error('Game not found')
        return
      }
      
      // Si el juego está en setup, remover jugador
      if (game.gamePhase === 'setup') {
        console.log(`🚪 Auto-leaving player ${playerId} from lobby ${gameId}`)
        const result = await GameService.leaveGame(gameId, playerId, userId)
        
        io.to('lobby-list').emit('lobby:player-count-changed', { 
          gameId, 
          currentPlayers: result.game!.activePlayers.length 
        })
      } 
      // Si el juego está activo, marcar como desconectado
      else if (game.gamePhase === 'playing') {
        console.log(`⏸️ Marking player ${playerId} as disconnected in game ${gameId}`)
        const result = await GameService.markPlayerDisconnected(gameId, playerId)
        
        // Notificar a todos en el juego
        io.to(gameId).emit('player:disconnected', {
          playerId,
          isPaused: result.shouldPause,
          disconnectedAt: Date.now()
        })

        const timeoutMs = game.gameSettings.reconnectionTimeoutMinutes * 60 * 1000
        scheduleDisconnectionTimeout(io, gameId, playerId, timeoutMs)
        
        // Actualizar estado del juego
        const updatedState = await GameService.getPlayerGameState(gameId)
        io.to(gameId).emit('game:stateUpdate', {
          publicGameState: updatedState.publicState
        })
      }
      
      socketToPlayer.delete(socket.id)
    } catch (error) {
      console.error(`Error handling disconnect:`, error)
    }
  }
})
}