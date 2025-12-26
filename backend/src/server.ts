import dotenv from 'dotenv'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { connectDatabase } from './config/database'

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

// Middleware
app.use(cors())
app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`)

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`)
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