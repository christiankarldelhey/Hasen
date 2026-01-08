import { Server } from 'socket.io'
import { setupLobbyHandlers } from './handlers/lobbyHandlers.js'
import { setupRoundHandlers } from './handlers/roundHandlers.js'
import { setupConnectionHandlers } from './handlers/connectionHandlers.js'

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`)
    
    // Registrar todos los handlers
    setupLobbyHandlers(io, socket)
    setupRoundHandlers(io, socket)
    setupConnectionHandlers(io, socket)
  })
}