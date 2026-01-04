import { Server } from 'socket.io'
import { setupLobbyHandlers } from './handlers/lobbyHandlers.js'
import { setupGameHandlers } from './handlers/gameHandlers.js'
import { setupConnectionHandlers } from './handlers/connectionHandlers.js'

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`)
    
    // Registrar todos los handlers
    setupLobbyHandlers(io, socket)
    setupGameHandlers(io, socket)
    setupConnectionHandlers(io, socket)
  })
}