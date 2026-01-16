<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useGameControls } from '../common/composables/useGameControls';
import PlayerHand from '@/features/Players/PlayerHand.vue';
import GameInfo from '@/features/Game/GameInfo.vue';
import Deck from '@/features/Game/Deck.vue';
import BidsPanel from '@/features/Bids/BidsPanel.vue';
import OtherPlayerHand from '@/features/Players/OtherPlayerHand.vue';
import GameLayout from '../layout/GameLayout.vue';
import Trick from '@/features/Trick/Trick.vue';

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
} = useGameControls(gameId);

onMounted(() => {
  initialize();
});

</script>

<template>
  <GameLayout>
    <div v-if="loading" class="text-center py-12">
      <div class="text-xl text-black">Loading game...</div>
    </div>
    
    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-8">
      <p class="font-bold">Error</p>
      <p>{{ error }}</p>
    </div>

    <div v-else class="relative w-full h-screen">
      <GameInfo />
      <Deck />
      <BidsPanel />
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
      
      <!-- Botón para finish trick cuando está en estado 'resolve' -->
      <div v-if="isTrickInResolve" class="absolute right-8 bottom-32 flex flex-col gap-3 pointer-events-auto z-[2000]">
        <button
          @click="handleFinishTrick"
          class="px-6 py-3 bg-hasen-green text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition-colors"
        >
          Finish Trick
        </button>
      </div>
      
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
      />
    </div>
  </GameLayout>
</template>