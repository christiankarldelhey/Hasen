import dotenv from 'dotenv'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import gameRoutes from './routes/gameRoutes.js'
import { GameService } from './services/GameService.js'
import { PlayerId } from '../../domain/interfaces/Player.js'
import cors from 'cors'
import { connectDatabase } from './config/database.js'

// Map of socket.id -> {gameId, playerId}
const socketToPlayer = new Map<string, { gameId: string; playerId: PlayerId }>();

// Load environment variables
dotenv.config()

const app = express()
const httpServer = createServer(app)

// Configure Socket.io with CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})
app.set('io', io)

// Middleware
app.use(cors())
app.use(express.json())
app.use('/api', gameRoutes)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`)

  // Handler to join game room
  socket.on('lobby:join', ({ gameId, playerId }: { gameId: string; playerId: PlayerId }) => {
    socket.join(gameId);
    socketToPlayer.set(socket.id, { gameId, playerId });
    console.log(`🎮 Socket ${socket.id} joined lobby: ${gameId} as ${playerId}`);
    
    // Notificar a otros en el lobby
    io.to(gameId).emit('player:joined', { playerId });
  });

  // Handle disconnection - AUTO LEAVE
  socket.on('disconnect', async () => {
    console.log(`❌ Client disconnected: ${socket.id}`)
    
    const playerInfo = socketToPlayer.get(socket.id);
    if (playerInfo) {
      const { gameId, playerId } = playerInfo;
      try {
        console.log(`🚪 Auto-leaving player ${playerId} from game ${gameId}`);
        const result = await GameService.leaveGame(gameId, playerId);
        
        // Notificar a otros jugadores en el lobby
        if (!result.gameDeleted) {
          io.to(gameId).emit('player:left', { 
            playerId,
            currentPlayers: result.game!.activePlayers.length 
          });
        } else {
          io.to(gameId).emit('game:deleted', { message: 'Host left, game deleted' });
        }
        
        socketToPlayer.delete(socket.id);
      } catch (error) {
        console.error(`Error auto-leaving game:`, error);
      }
    }
  })
  // Test event
  socket.on('ping', () => {
    socket.emit('pong', { message: 'Server is alive!' })
  })
})

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDatabase()

    // Start HTTP server
    const PORT = process.env.PORT || 3001
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📡 Socket.io ready for connections`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()