<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useLobbyStore } from '../../stores/lobbyStore';
import { useHasenStore } from '../../stores/hasenStore';
import { useGameAPI } from '../../common/composables/useGameAPI';
import { useSocketLobby } from '../../common/composables/useSocketLobby';
import { userIdService } from '../../services/userIdService';
import { useRouter } from 'vue-router';
import { useAudio } from '../../common/composables/useAudio';
import LobbyOptions from './LobbyOptions.vue';
import Room from './Room.vue';
import RoomSettings from './RoomSettings.vue';

const lobbyStore = useLobbyStore();
const hasenStore = useHasenStore();
const gameAPI = useGameAPI();
const socketLobby = useSocketLobby();
const router = useRouter();
const { playMusic } = useAudio(); 

type ViewState = 'menu' | 'room' | 'settings';
const currentView = ref<ViewState>('menu');

onMounted(async () => {
  socketLobby.joinLobbyList();
  await gameAPI.fetchGames();
  
  socketLobby.onGameStarted(({ gameId }) => {
    router.push(`/game/${gameId}`);
  });
});

onUnmounted(() => {
  socketLobby.leaveLobbyList();
  socketLobby.offGameStarted();
});

const handleViewChange = (view: ViewState) => {
  currentView.value = view;
};

const handleGameSettings = () => {
  playMusic('lobby');
  handleViewChange('settings');
};

const handleCreateGame = async (gameName: string, playerId: string) => {
  playMusic('lobby');
  try {
    await gameAPI.createGame(gameName, playerId as import('@domain/interfaces/Player').PlayerId);
    handleViewChange('room');
  } catch (err) {
    console.error('Error creating game:', err);
  }
};

const handleJoinGame = async (gameId: string) => {
  playMusic('lobby');
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
  if (lobbyStore.currentRoomId && hasenStore.currentPlayerId) {
    socketLobby.leaveLobby({ 
      gameId: lobbyStore.currentRoomId, 
      playerId: hasenStore.currentPlayerId,
      userId 
    });
  }
  gameAPI.fetchGames();
};

const handleLeaveGame = async () => {
  try {
    if (lobbyStore.currentRoomId && hasenStore.currentPlayerId) {
      const userId = userIdService.getUserId();
      
      if (lobbyStore.isHost(hasenStore.currentPlayerId)) {
        const confirmed = confirm('Are you sure you want to delete this room?');
        if (!confirmed) {
          return;
        }
        // Host: Deletear el juego via API REST
        await gameAPI.deleteGame(lobbyStore.currentRoomId, hasenStore.currentPlayerId);
        // Notificar via socket que el juego fue eliminado
        socketLobby.deleteGameByHost(lobbyStore.currentRoomId);
      } else {
        // Jugador normal: Solo hacer leave
        socketLobby.leaveLobby({ 
          gameId: lobbyStore.currentRoomId, 
          playerId: hasenStore.currentPlayerId,
          userId 
        });
      }
      
      lobbyStore.clearCurrentRoom();
      handleBackToMenu();
    }
  } catch (err) {
    console.error('Error leaving/deleting game:', err);
  }
};

const handleStartGame = async () => {
  try {
    if (lobbyStore.currentRoomId && hasenStore.currentPlayerId) {
      await gameAPI.startGame(lobbyStore.currentRoomId, hasenStore.currentPlayerId);
    }
  } catch (err) {
    console.error('Error starting game:', err);
  }
};
</script>

<template>
  <div class="card card-border bg-hasen-base w-full md:w-[40%] h-[85vh] shadow-lg flex flex-col relative overflow-hidden">
    <!-- Background image that ignores padding -->
    <div class="absolute bottom-0 left-0 right-0 pointer-events-none z-0">
      <img 
        src="../../assets/backgrounds/lobby-menu-background.png" 
        alt="Lobby background"
        class="w-full object-cover object-bottom opacity-95"
      />
    </div>
    
    <div class="card-header relative z-10">
      <h2 class="text-center text-xxl font-bold text-black my-4">Hasen</h2>
    </div>
    <div class="card-body flex flex-col gap-4 overflow-y-auto relative z-10">
      <LobbyOptions
        v-if="currentView === 'menu'"
        :games="lobbyStore.rooms"
        :loading="lobbyStore.loading"
        :error="lobbyStore.error"
        :joining-game-id="lobbyStore.joiningRoomId"
        @game-settings="handleGameSettings"
        @join-game="handleJoinGame"
      />
      
      <RoomSettings
        v-if="currentView === 'settings'"
        @create-game="handleCreateGame"
        @back="handleViewChange('menu')"
      />
      
      <Room
        v-if="currentView === 'room' && lobbyStore.currentRoomData"
        :current-game="lobbyStore.currentRoomData"
        :player-id="hasenStore.currentPlayerId"
        @back="handleBackToMenu"
        @start-game="handleStartGame"
        @leave-game="handleLeaveGame"
      />
    </div>
  </div>
</template>