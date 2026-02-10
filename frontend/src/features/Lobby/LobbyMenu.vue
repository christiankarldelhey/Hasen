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
import CreateGameMenu from './CreateGameMenu.vue';
import JoinGameMenu from './JoinGameMenu.vue';
import RulesMenu from './RulesMenu.vue';
import SettingsMenu from './SettingsMenu.vue';
import ActionButton from '../../common/components/ActionButton.vue';
import { useI18n } from '../../common/composables/useI18n';

const lobbyStore = useLobbyStore();
const hasenStore = useHasenStore();
const gameAPI = useGameAPI();
const socketLobby = useSocketLobby();
const router = useRouter();
const { playMusic } = useAudio();
const { t } = useI18n(); 

type ViewState = 'menu' | 'room' | 'create-game' | 'join-game' | 'rules' | 'settings';
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

const handleCreateGameView = () => {
  handleViewChange('create-game');
};

const handleJoinGameView = () => {
  handleViewChange('join-game');
};

const handleRulesView = () => {
  handleViewChange('rules');
};

const handleSettingsView = () => {
  handleViewChange('settings');
};

const handleCreateGame = async (gameName: string, playerId: string, maxPlayers: number, pointsToWin: number) => {
  playMusic('lobby');
  try {
    await gameAPI.createGame(gameName, playerId as import('@domain/interfaces/Player').PlayerId, maxPlayers, pointsToWin);
    handleViewChange('room');
  } catch (err) {
    console.error('Error creating game:', err);
  }
};

const getTitle = () => {
  switch (currentView.value) {
    case 'menu':
      return 'Hasen';
    case 'create-game':
      return t('lobby.createGameTitle');
    case 'join-game':
      return t('lobby.joinGameTitle');
    case 'rules':
      return t('lobby.rulesTitle');
    case 'settings':
      return t('lobby.settingsTitle');
    case 'room':
      return lobbyStore.currentRoomData?.gameName || 'Hasen';
    default:
      return 'Hasen';
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
    
    
    <div class="card-header z-10">
      <h1 class="text-center text-2xl font-semibold text-black mt-4">{{ getTitle() }}</h1>
    </div>
    <div class="card-body z-10 !p-0 flex flex-col overflow-hidden">
      <!-- Back to Menu button for all views except menu and room - FIXED -->
      <div v-if="currentView !== 'menu' && currentView !== 'room'" class="px-8 pt-8 pb-4 flex-shrink-0">
        <ActionButton 
          :label="t('lobby.backToMenu')" 
          variant="tertiary"
          @click="handleViewChange('menu')"
        />
      </div>
      
      <!-- Scrollable content area -->
      <div class="flex-1 overflow-y-auto px-8 pb-8" :class="{ 'pt-8': currentView === 'menu' || currentView === 'room' }">
        <div v-if="currentView === 'menu'" class="flex flex-col justify-center h-full">
          <LobbyOptions
            @create-game="handleCreateGameView"
            @join-game="handleJoinGameView"
            @rules="handleRulesView"
            @settings="handleSettingsView"
          />
        </div>
        
        <CreateGameMenu
          v-if="currentView === 'create-game'"
          @create-game="handleCreateGame"
        />
        
        <JoinGameMenu
          v-if="currentView === 'join-game'"
          :games="lobbyStore.rooms"
          :loading="lobbyStore.loading"
          :error="lobbyStore.error"
          :joining-game-id="lobbyStore.joiningRoomId"
          @join-game="handleJoinGame"
        />
        
        <RulesMenu
          v-if="currentView === 'rules'"
        />
        
        <SettingsMenu
          v-if="currentView === 'settings'"
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
    <!-- Background image that ignores padding -->
    <div v-if="currentView !== 'rules'" class="pointer-events-none z-0">
      <img 
        src="../../assets/backgrounds/lobby-menu-background.png" 
        alt="Lobby background"
        class="w-full object-cover object-bottom opacity-95"
      />
    </div>
  </div>
</template>