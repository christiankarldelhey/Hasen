<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useGame } from '../composables/useGame';
import MenuContent from './MenuContent.vue';
import LobbyContent from './LobbyContent.vue';
import GameSettingsContent from './GameSettingsContent.vue';
import { useRouter } from 'vue-router';
import type { LobbyGame } from '@domain/interfaces/Game';

const { games, loading, error, fetchGames, joinGame, joiningGameId, createGame } = useGame();
const router = useRouter();

type ViewState = 'menu' | 'lobby' | 'settings';
const currentView = ref<ViewState>('menu');
const currentGameId = ref<string>('');
const currentPlayerId = ref<string>('');

onMounted(() => {
  fetchGames();
});

const handleViewChange = (view: ViewState) => {
  currentView.value = view;
};

const handleGameSettings = () => {
  // Handle game settings logic here
  handleViewChange('settings');
};

const handleCreateGame = async (gameName, playerId) => {
  try {
    const result = await createGame(gameName, playerId);
    if (result) {
      currentGameId.value = result.gameId;
      currentPlayerId.value = result.assignedPlayerId;
      sessionStorage.setItem('current_player_id', result.assignedPlayerId);
      sessionStorage.setItem('current_game_id', result.gameId);
      handleViewChange('lobby');
    }
  } catch (err) {
    console.error('Error creating game:', err);
  }
};

const handleJoinGame = async (gameId: string) => {
  try {
    const result = await joinGame(gameId);
    if (result) {
      currentGameId.value = result.gameId;
      currentPlayerId.value = result.assignedPlayerId;
      handleViewChange('lobby');
    }
  } catch (err) {
    console.error('Error joining game:', err);
  }
};

const handleBackToMenu = () => {
  handleViewChange('menu');;
  fetchGames();
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
        :games="games"
        :loading="loading"
        :error="error"
        :joining-game-id="joiningGameId"
        @game-settings="handleGameSettings"
        @join-game="handleJoinGame"
      />
      
      <GameSettingsContent
        v-if="currentView === 'settings'"
        :games="games"
        :loading="loading"
        :error="error"
        :joining-game-id="joiningGameId"
        @create-game="handleCreateGame"
        @back="handleViewChange('menu')"
      />
      
      <LobbyContent
        v-if="currentView === 'lobby'"
        :current-game="games.find((game: LobbyGame) => game.gameId === currentGameId) as LobbyGame"
        :player-id="currentPlayerId"
        :assigned-player-id="(games.find((game: LobbyGame) => game.gameId === currentGameId) as LobbyGame)?.hostPlayer || ''"
        @back="handleBackToMenu"
        @start-game="handleViewChange('settings')"
        @leave-game="handleBackToMenu"
      />
    </div>
  </div>
</template>