<script setup lang="ts">
import { onMounted, onUnmounted, provide, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useGameSession } from '../common/composables/useGameSession';
import { useSocketGame } from '../common/composables/useSocketGame';
import { useGameStore } from '../stores/gameStore';
import type { PlayerId } from '@domain/interfaces/Player';
import PlayerHand from '@/features/Players/PlayerHand.vue';
import GameInfo from '@/features/Game/GameInfo.vue';
import AvailableBids from '@/features/Bids/AvailableBids.vue';
import OtherPlayerHand from '@/features/Players/OtherPlayerHand.vue';
import GameLayout from '../layout/GameLayout.vue';
import Trick from '@/features/Trick/Trick.vue';
import RabbitLoader from '@/common/components/RabbitLoader.vue';
import RoundEndedModal from '@/features/Modals/RoundEndedModal.vue';
import type { GameEvent } from '@domain/events/GameEvents';

const route = useRoute();
const gameId = route.params.gameId as string;
const socketGame = useSocketGame();
const gameStore = useGameStore();

const {
  playerHand,
  opponentPositions,
  trickCards,
  winningCardId,
  trickState,
  isTrickInResolve,
  canFinishTrick,
  loading,
  error,
  handMode,
  isMyTurn,
  isPlayerSelectable,
  isCardSelectable,
  handlePlayerClick,
  handleCardClick,
  handleSkipReplacement,
  handleConfirmReplacement,
  handlePlayCard,
  handleFinishTurn,
  handleFinishTrick,
  initialize
} = useGameSession(gameId);

// Proveer métodos de special cards a componentes hijos
provide('specialCards', {
  isPlayerSelectable,
  isCardSelectable,
  handlePlayerClick,
  handleCardClick
});

// Modal de Round Ended
const showRoundEndedModal = ref(false);
const readyPlayers = ref<PlayerId[]>([]);
const totalPlayers = ref(0);

const handleGameEvent = (event: GameEvent) => {
  if (event.type === 'ROUND_ENDED') {
    console.log('🎯 ROUND_ENDED received, showing modal');
    showRoundEndedModal.value = true;
    readyPlayers.value = [];
    totalPlayers.value = gameStore.publicGameState?.activePlayers.length || 0;
  }
  // Actualizar estado de ready players
  if (event.type === 'PLAYERS_READY_STATUS') {
    const payload = (event as any).payload;
    readyPlayers.value = payload.readyPlayers;
    totalPlayers.value = payload.totalPlayers;
    console.log(`📊 Ready status: ${payload.readyPlayers.length}/${payload.totalPlayers}`);
  }
  // Cerrar modal cuando empieza nuevo round
  if (event.type === 'ROUND_SETUP_COMPLETED') {
    if (showRoundEndedModal.value) {
      console.log('🔄 New round started, closing modal');
      showRoundEndedModal.value = false;
      readyPlayers.value = [];
    }
  }
};

const handleCloseRoundModal = () => {
  showRoundEndedModal.value = false;
  console.log('✅ Round modal closed manually');
};

const handleContinueRound = () => {
  console.log('✅ Player ready for next round');
  socketGame.readyForNextRound(gameId);
};

onMounted(() => {
  initialize();
  socketGame.onGameEvent(handleGameEvent);
  console.log('🎮 GameView mounted with async round modal');
});

onUnmounted(() => {
  socketGame.offGameEvent();
});

</script>

<template>
  <GameLayout>
    <div v-if="loading" class="py-12">
      <RabbitLoader size="xl" />
    </div>
    
    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-8">
      <p class="font-bold">Error</p>
      <p>{{ error }}</p>
    </div>

    <div v-else class="relative w-full h-screen">
      <GameInfo />
      
      <AvailableBids />
      <!-- Oponentes en diferentes posiciones -->
      <OtherPlayerHand
        v-for="opponent in opponentPositions"
        :key="opponent.playerId"
        :player-id="opponent.playerId"
        :public-card-id="opponent.publicCardId"
        :position="opponent.position"
      />
      
      <!-- Trick en el centro exacto de la pantalla -->
      <Trick :cards="trickCards" :winning-card-id="winningCardId" :trick-state="trickState" />
      
      <!-- Mano del jugador (fixed en el bottom) -->
      <PlayerHand 
        :cards="playerHand" 
        :mode="handMode"
        :is-my-turn="isMyTurn"
        :is-trick-in-resolve="isTrickInResolve"
        :can-finish-trick="canFinishTrick"
        @skip-replacement="handleSkipReplacement"
        @confirm-replacement="handleConfirmReplacement"
        @play-card="handlePlayCard"
        @finish-turn="handleFinishTurn"
        @finish-trick="handleFinishTrick"
      />
    </div>

    <!-- Round Ended Modal -->
    <RoundEndedModal 
      :isOpen="showRoundEndedModal"
      :round="gameStore.publicGameState?.round || null"
      :readyPlayers="readyPlayers"
      :totalPlayers="totalPlayers"
      @close="handleCloseRoundModal"
      @continue="handleContinueRound"
    />
  </GameLayout>
</template>