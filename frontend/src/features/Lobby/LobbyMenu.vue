<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useGameStore } from '../../stores/gameStore';
import { useGameAPI } from '../../common/composables/useGameAPI';
import { useSocket } from '../../common/composables/useSocket';
import { userIdService } from '../../services/userIdService';
import { useRouter } from 'vue-router';
import LobbyOptions from './LobbyOptions.vue';
import Room from './Room.vue';
import RoomSettings from './RoomSettings.vue';

const gameStore = useGameStore();
const gameAPI = useGameAPI();
const socket = useSocket();
const router = useRouter(); 

type ViewState = 'menu' | 'room' | 'settings';
const currentView = ref<ViewState>('menu');

onMounted(async () => {
  socket.emit('lobby-list:join');
  await gameAPI.fetchGames();
  
  socket.on('game:started', ({ gameId }) => {
    console.log('Game started, emitting round:start and redirecting...');
    socket.emit('round:start', { gameId });
    router.push(`/game/${gameId}`);
  });
});

onUnmounted(() => {
  socket.emit('lobby-list:leave');
  socket.off('game:started');
});

const handleViewChange = (view: ViewState) => {
  currentView.value = view;
};

const handleGameSettings = () => {
  handleViewChange('settings');
};

const handleCreateGame = async (gameName: string, playerId: string) => {
  try {
    await gameAPI.createGame(gameName, playerId);
    handleViewChange('room');
  } catch (err) {
    console.error('Error creating game:', err);
  }
};

const handleJoinGame = async (gameId: string) => {
  try {
    await gameAPI.joinGame(gameId);
    handleViewChange('room');
  } catch (err) {
    console.error('Error joining game:', err);
  }
};

const handleBackToMenu = () => {
  const userId = userIdService.getUserId();
  handleViewChange('menu');
  socket.emit('lobby:leave', { 
    gameId: gameStore.currentGameId, 
    playerId: gameStore.currentPlayerId,
    userId 
  });
  gameAPI.fetchGames();
};

const handleLeaveGame = async () => {
  try {
    if (gameStore.currentGameId && gameStore.currentPlayerId) {
      const userId = userIdService.getUserId();
      
      if (gameStore.isHost) {
        const confirmed = confirm('Are you sure you want to delete this room?');
        if (!confirmed) {
          return;
        }
        // Host: Deletear el juego via API REST
        await gameAPI.deleteGame(gameStore.currentGameId, gameStore.currentPlayerId);
        // Notificar via socket que el juego fue eliminado
        socket.emit('game:deleted-by-host', { gameId: gameStore.currentGameId });
      } else {
        // Jugador normal: Solo hacer leave
        socket.emit('lobby:leave', { 
          gameId: gameStore.currentGameId, 
          playerId: gameStore.currentPlayerId,
          userId 
        });
      }
      
      gameStore.clearCurrentGame();
      handleBackToMenu();
    }
  } catch (err) {
    console.error('Error leaving/deleting game:', err);
  }
};

const handleStartGame = async () => {
  try {
    if (gameStore.currentGameId && gameStore.currentPlayerId) {
      await gameAPI.startGame(gameStore.currentGameId, gameStore.currentPlayerId);
    }
  } catch (err) {
    console.error('Error starting game:', err);
  }
};
</script>

<template>
  <div class="card card-border bg-hasen-base w-full md:w-[40%] h-[75vh] shadow-lg flex flex-col">
    <div class="card-header">
      <h2 class="text-center text-xxl font-bold text-black my-4">Hasen</h2>
    </div>
    <div class="card-body flex flex-col gap-4 overflow-y-auto">
      <LobbyOptions
        v-if="currentView === 'menu'"
        :games="gameStore.games"
        :loading="gameStore.loading"
        :error="gameStore.error"
        :joining-game-id="gameStore.joiningGameId"
        @game-settings="handleGameSettings"
        @join-game="handleJoinGame"
      />
      
      <RoomSettings
        v-if="currentView === 'settings'"
        @create-game="handleCreateGame"
        @back="handleViewChange('menu')"
      />
      
      <Room
        v-if="currentView === 'room' && gameStore.currentGameData"
        :current-game="gameStore.currentGameData"
        :player-id="gameStore.currentPlayerId"
        @back="handleBackToMenu"
        @start-game="handleStartGame"
        @leave-game="handleLeaveGame"
      />
    </div>
  </div>
</template>