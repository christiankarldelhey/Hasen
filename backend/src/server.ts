import dotenv from 'dotenv'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import gameRoutes from './routes/gameRoutes.js'
import { GameCleanupService } from './services/GameCleanupService.js'
import cors from 'cors'
import { connectDatabase } from './config/database.js'
import { setupSocketHandlers } from './socket/index.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)

GameCleanupService.startCleanupService();

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

// Setup socket handlers (delegado a socket/index.ts)
setupSocketHandlers(io)

// Start server
async function startServer() {
  
  try {
    await connectDatabase()
    
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

// Limpiar al cerrar el servidor
process.on('SIGTERM', () => {
  GameCleanupService.stopCleanupService();
  process.exit(0);
});
process.on('SIGINT', () => {
  GameCleanupService.stopCleanupService();
  process.exit(0);
});
