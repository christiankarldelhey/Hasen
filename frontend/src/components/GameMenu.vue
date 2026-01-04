<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useGameStore } from '../stores/gameStore';
import { useGameAPI } from '../composables/useGameAPI';
import { useSocket } from '../composables/useSocket';
import MenuContent from './MenuContent.vue';
import LobbyContent from './LobbyContent.vue';
import GameSettingsContent from './GameSettingsContent.vue';

const gameStore = useGameStore();
const gameAPI = useGameAPI();
const socket = useSocket();

type ViewState = 'menu' | 'lobby' | 'settings';
const currentView = ref<ViewState>('menu');

onMounted(() => {
  gameAPI.fetchGames();
  gameStore.restoreSession();
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
    handleViewChange('lobby');
  } catch (err) {
    console.error('Error creating game:', err);
  }
};

const handleJoinGame = async (gameId: string) => {
  try {
    await gameAPI.joinGame(gameId);
    handleViewChange('lobby');
  } catch (err) {
    console.error('Error joining game:', err);
  }
};

const handleBackToMenu = () => {
  handleViewChange('menu');
  gameAPI.fetchGames();
};

const handleLeaveGame = () => {
  try {
    if (gameStore.currentGameId && gameStore.currentPlayerId) {
      socket.emit('lobby:leave', { 
        gameId: gameStore.currentGameId, 
        playerId: gameStore.currentPlayerId 
      });
      gameStore.clearCurrentGame();
      handleBackToMenu();
    }
  } catch (err) {
    console.error('Error leaving game:', err);
  }
};
</script>

<template>
  <div class="card card-border bg-hasen-base w-full md:w-[40%] h-[75vh] shadow-lg flex flex-col">
    <div class="card-header">
      <h2 class="text-center text-xxl font-bold text-black my-4">Hasen</h2>
    </div>
    <div class="card-body flex flex-col gap-4 overflow-y-auto">
      <MenuContent
        v-if="currentView === 'menu'"
        :games="gameStore.games"
        :loading="gameStore.loading"
        :error="gameStore.error"
        :joining-game-id="gameStore.joiningGameId"
        @game-settings="handleGameSettings"
        @join-game="handleJoinGame"
      />
      
      <GameSettingsContent
        v-if="currentView === 'settings'"
        @create-game="handleCreateGame"
        @back="handleViewChange('menu')"
      />
      
      <LobbyContent
        v-if="currentView === 'lobby' && gameStore.currentGameData"
        :current-game="gameStore.currentGameData"
        :player-id="gameStore.currentPlayerId"
        @back="handleBackToMenu"
        @start-game="handleViewChange('settings')"
        @leave-game="handleLeaveGame"
      />
    </div>
  </div>
</template>