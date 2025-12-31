import { Server, Socket } from 'socket.io';
import { GameModel } from '../models/Game.js';
import { createDeckShuffledEvent } from '../../../domain/events/GameEvents.js';

export function setupGameSockets(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Unirse a un game room
    socket.on('game:join-room', ({ gameId, playerId }) => {
      socket.join(gameId);
      console.log(`🎮 Player ${playerId} joined room ${gameId}`);
      
      // Notificar a todos en el room
      io.to(gameId).emit('player:joined', { playerId });
    });

    // Cuando el host inicia el juego
    socket.on('game:started', async ({ gameId }) => {
      try {
        console.log(`🎲 Starting round for game ${gameId}`);
        
        // 1. Obtener el game de la BD
        const game = await GameModel.findOne({ gameId });
        
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        // 2. Verificar que está en fase playing
        if (game.gamePhase !== 'playing') {
          socket.emit('error', { message: 'Game is not in playing phase' });
          return;
        }

        // 3. Cambiar fase del round a shuffle
        game.round.roundPhase = 'shuffle';
        game.round.round = 1;
        await game.save();

        // 4. Emitir evento de shuffle a todos en el room
        const shuffleEvent = createDeckShuffledEvent(1, game.deck.length);
        io.to(gameId).emit('game:event', shuffleEvent);

        console.log(`✅ Round started for game ${gameId}`);
        
      } catch (error) {
        console.error('Error starting round:', error);
        socket.emit('error', { message: 'Failed to start round' });
      }
    });

    // Desconexión
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
}