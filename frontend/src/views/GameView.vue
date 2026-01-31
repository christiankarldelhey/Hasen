<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useGameSession } from '../common/composables/useGameSession';
import PlayerHand from '@/features/Players/PlayerHand.vue';
import GameInfo from '@/features/Game/GameInfo.vue';
import AvailableBids from '@/features/Bids/AvailableBids.vue';
import OtherPlayerHand from '@/features/Players/OtherPlayerHand.vue';
import GameLayout from '../layout/GameLayout.vue';
import Trick from '@/features/Trick/Trick.vue';
import RabbitLoader from '@/common/components/RabbitLoader.vue';

const route = useRoute();
const gameId = route.params.gameId as string;

const {
  playerHand,
  opponentPositions,
  trickCards,
  winningCardId,
  trickState,
  isTrickInResolve,
  loading,
  error,
  handMode,
  isMyTurn,
  handleSkipReplacement,
  handleConfirmReplacement,
  handlePlayCard,
  handleFinishTurn,
  handleFinishTrick,
  initialize
} = useGameSession(gameId);

onMounted(() => {
  initialize();
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
        :hand-cards-count="opponent.handCardsCount"
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
        @skip-replacement="handleSkipReplacement"
        @confirm-replacement="handleConfirmReplacement"
        @play-card="handlePlayCard"
        @finish-turn="handleFinishTurn"
        @finish-trick="handleFinishTrick"
      />
    </div>
  </GameLayout>
</template>