import { Server, Socket } from 'socket.io'
import { socketToPlayer } from './lobbyHandlers.js'
import { PlayerId } from '@domain/interfaces/Player.js'
import type { CompositionRoot } from '@/app/composition-root.js'

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

function scheduleDisconnectionTimeout(
  gameId: string,
  playerId: PlayerId,
  timeoutMs: number,
  compositionRoot: CompositionRoot
) {
  clearDisconnectionTimeout(gameId, playerId)

  const key = getDisconnectionTimerKey(gameId, playerId)
  const timer = setTimeout(async () => {
    try {
      await compositionRoot.connectionLifecycle.handleDisconnectionTimeoutUseCase.execute({
        gameId,
        playerId
      })
    } catch (error) {
      console.error('Error in disconnection timeout handler:', error)
    } finally {
      disconnectionTimers.delete(key)
    }
  }, timeoutMs)

  disconnectionTimers.set(key, timer)
}

export function setupConnectionHandlers(io: Server, socket: Socket, compositionRoot: CompositionRoot) {

socket.on('game:leave-match', async ({ gameId, playerId, userId }: { gameId: string; playerId: PlayerId; userId: string }) => {
  try {
    console.log(`🚪 Player ${playerId} left active match ${gameId}`)

    socket.leave(gameId)
    socketToPlayer.delete(socket.id)
    clearDisconnectionTimeout(gameId, playerId)

    await compositionRoot.connectionLifecycle.leaveMatchUseCase.execute({
      gameId,
      playerId,
      userId
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
      const disconnectResult = await compositionRoot.connectionLifecycle.handleSocketDisconnectUseCase.execute({
        gameId,
        playerId,
        userId
      })

      if (disconnectResult.kind === 'setup_left') {
        console.log(`🚪 Auto-leaving player ${playerId} from lobby ${gameId}`)
        io.to('lobby-list').emit('lobby:player-count-changed', {
          gameId,
          currentPlayers: disconnectResult.currentPlayers
        })
      }

      if (disconnectResult.kind === 'playing_disconnected') {
        console.log(`⏸️ Marking player ${playerId} as disconnected in game ${gameId}`)

        io.to(gameId).emit('player:disconnected', {
          playerId,
          isPaused: disconnectResult.shouldPause,
          disconnectedAt: Date.now()
        })

        scheduleDisconnectionTimeout(gameId, playerId, disconnectResult.timeoutMs, compositionRoot)

        io.to(gameId).emit('game:stateUpdate', {
          publicGameState: disconnectResult.publicState
        })
      }
      
      socketToPlayer.delete(socket.id)
    } catch (error) {
      console.error(`Error handling disconnect:`, error)
    }
  }
})
}