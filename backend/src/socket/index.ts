import { Server } from 'socket.io'
import { setupLobbyHandlers } from './handlers/lobbyHandlers.js'
import { setupRoundHandlers } from './handlers/roundHandlers.js'
import { setupConnectionHandlers } from './handlers/connectionHandlers.js'
import type { CompositionRoot } from '@/app/composition-root.js'

export function setupSocketHandlers(io: Server, compositionRoot: CompositionRoot) {
  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`)
    
    // Registrar todos los handlers
    setupLobbyHandlers(io, socket, compositionRoot)
    setupRoundHandlers(io, socket, compositionRoot)
    setupConnectionHandlers(io, socket, compositionRoot)
  })
}