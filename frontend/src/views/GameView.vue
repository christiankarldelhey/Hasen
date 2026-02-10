<script setup lang="ts">
import { computed, onMounted, onUnmounted, provide, ref, watch } from 'vue';
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
import AnimationOverlay from '@/features/Animations/components/AnimationOverlay.vue';
import { provideAnimationCoords, useDealAnimation, useCardAnimation } from '@/features/Animations';
import type { GameEvent, CardPlayedEvent, TrickCompletedEvent } from '@domain/events/GameEvents';
import { useHasenStore } from '@/stores/hasenStore';
import { usePlayerConnection, GamePausedOverlay } from '@/features/PlayerConnection';

const route = useRoute();
const gameId = route.params.gameId as string;
const socketGame = useSocketGame();
const gameStore = useGameStore();
const hasenStore = useHasenStore();

// Animation system
const animCoords = provideAnimationCoords();
const { isDealing, animatedCards, dealProgress, startDeal } = useDealAnimation({ coords: animCoords });
const { flyingCards: cardAnimCards, animatePlayCard, animateWinTrick } = useCardAnimation({ coords: animCoords });

// Merge all animated cards into a single array for the overlay
const allAnimatedCards = computed(() => [
  ...animatedCards.value,
  ...cardAnimCards.value,
]);

// Pending trick winner info for win-trick animation
const pendingTrickWinner = ref<{ winnerId: PlayerId; cards: any[] } | null>(null);

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

// Player connection management
const playerConnection = usePlayerConnection(gameId);
const {
  isPaused,
  pauseReason,
  disconnectedPlayerIds,
  setupListeners: setupConnectionListeners,
  cleanupListeners: cleanupConnectionListeners
} = playerConnection;

// Proveer métodos de special cards a componentes hijos
provide('specialCards', {
  isPlayerSelectable,
  isCardSelectable,
  handlePlayerClick,
  handleCardClick
});

// Proveer estado de dealing a componentes hijos
provide('isDealing', isDealing);
provide('dealProgress', dealProgress);

function triggerDealAnimation() {
  // Small delay to ensure components have mounted and registered coords
  setTimeout(() => {
    const playerKeys = ['player-hand']
    for (const op of opponentPositions.value) {
      playerKeys.push(`opponent-${op.position}`)
    }
    startDeal(playerKeys)
  }, 100)
}

// Watch round number — triggers on initial load AND on new rounds
watch(() => gameStore.currentRound, (newRound, oldRound) => {
  if (newRound > 0 && newRound !== oldRound) {
    triggerDealAnimation()
  }
});

// Modal de Round Ended
const showRoundEndedModal = ref(false);
const readyPlayers = ref<PlayerId[]>([]);
const totalPlayers = ref(0);

const handleGameEvent = async (event: GameEvent) => {
  // Play card animation
  if (event.type === 'CARD_PLAYED') {
    const payload = (event as CardPlayedEvent).payload;
    await animatePlayCard(
      payload.card,
      payload.playerId,
      hasenStore.currentPlayerId || null,
      opponentPositions.value
    );
  }

  // Store trick winner info when trick completes (cards still visible)
  if (event.type === 'TRICK_COMPLETED') {
    const payload = (event as TrickCompletedEvent).payload;
    pendingTrickWinner.value = {
      winnerId: payload.winner,
      cards: payload.cards,
    };
  }

  // Win trick animation when trick is finished (cards about to be cleared)
  if (event.type === 'TRICK_FINISHED' && pendingTrickWinner.value) {
    const { winnerId, cards } = pendingTrickWinner.value;
    pendingTrickWinner.value = null;
    await animateWinTrick(
      cards,
      winnerId,
      hasenStore.currentPlayerId || null,
      opponentPositions.value
    );
  }

  if (event.type === 'ROUND_ENDED') {
    console.log('🎯 ROUND_ENDED');
    showRoundEndedModal.value = true;
    readyPlayers.value = [];
    totalPlayers.value = gameStore.publicGameState?.activePlayers.length || 0;
  }
  // Actualizar estado de ready players
  if (event.type === 'PLAYERS_READY_STATUS') {
    const payload = (event as any).payload;
    readyPlayers.value = payload.readyPlayers;
    totalPlayers.value = payload.totalPlayers;
  }
  // Cerrar modal cuando empieza nuevo round
  if (event.type === 'ROUND_SETUP_COMPLETED') {
    if (showRoundEndedModal.value) {
      showRoundEndedModal.value = false;
      readyPlayers.value = [];
    }
  }
};

const handleCloseRoundModal = () => {
  showRoundEndedModal.value = false;
};

const handleContinueRound = () => {
  socketGame.readyForNextRound(gameId);
};

onMounted(() => {
  initialize();
  socketGame.onGameEvent(handleGameEvent);
  setupConnectionListeners();
});

onUnmounted(() => {
  socketGame.offGameEvent();
  cleanupConnectionListeners();
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
      
      <!-- Animation overlay -->
      <AnimationOverlay :cards="allAnimatedCards" />
      
      <!-- Mano del jugador (fixed en el bottom) -->
      <PlayerHand 
        :cards="isDealing ? playerHand.slice(0, dealProgress['player-hand'] ?? 0) : playerHand" 
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

    <!-- Game Paused Overlay -->
    <GamePausedOverlay
      :is-paused="isPaused"
      :pause-reason="pauseReason"
      :disconnected-player-ids="disconnectedPlayerIds"
    />

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