<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useGameAPI } from '../common/composables/useGameAPI';
import { useSocketGame } from '../common/composables/useSocketGame';
import { useGameStore } from '@/stores/gameStore';
import { useHasenStore } from '@/stores/hasenStore';
import { useLobbyStore } from '@/stores/lobbyStore';
import PlayerHand from '@/features/Players/PlayerHand.vue';
import GameStats from '@/features/Game/GameStats.vue';
import Deck from '@/features/Game/Deck.vue';
import BidsPanel from '@/features/Bids/BidsPanel.vue';
import OtherPlayerHand from '@/features/Players/OtherPlayerHand.vue';
import PlayerDrawingPhase from '@/features/Game/PlayerDrawingPhase.vue';
import GameLayout from '../layout/GameLayout.vue';

const route = useRoute();
const gameId = route.params.gameId as string;
const gameAPI = useGameAPI();
const socketGame = useSocketGame();
const gameStore = useGameStore();
const hasenStore = useHasenStore();
const lobbyStore = useLobbyStore();
const playerHand = computed(() => gameStore.privateGameState?.hand || []);

const isPlayerDrawingPhase = computed(() => 
  gameStore.publicGameState?.round.roundPhase === 'player_drawing'
);

const isMyTurn = computed(() => 
  gameStore.publicGameState?.round.playerTurn === hasenStore.currentPlayerId
);

const handMode = computed(() => {
  return isPlayerDrawingPhase.value && isMyTurn.value ? 'card_replacement' : 'normal'
});

const handleSkipReplacement = () => {
  socketGame.skipCardReplacement(gameId)
};

const handleConfirmReplacement = (cardId: string, position: number) => {
  socketGame.replaceCard(gameId, cardId, position)
};

const loading = computed(() => lobbyStore.loading);
const error = computed(() => lobbyStore.error);

const opponentsCards = computed(() => {
  if (!gameStore.publicGameState?.opponentsPublicInfo || !hasenStore.currentPlayerId) {
    return []
  }
  
  // Filtrar la info de los oponentes (excluir la del jugador actual)
  return gameStore.publicGameState.opponentsPublicInfo.filter(
    (info) => info.playerId !== hasenStore.currentPlayerId
  )
})

const opponentPositions = computed(() => {
  const opponents = opponentsCards.value
  const totalOpponents = opponents.length
  
  if (totalOpponents === 0) return []
  
  // 1 oponente: solo top
  if (totalOpponents === 1 && opponents[0]) {
    return [{ ...opponents[0], position: 'top' as const }]
  }
  
  // 2 oponentes: top + left
  if (totalOpponents === 2 && opponents[0] && opponents[1]) {
    return [
      { ...opponents[0], position: 'top' as const },
      { ...opponents[1], position: 'left' as const }
    ]
  }
  
  // 3 oponentes: top + left + right
  if (totalOpponents === 3 && opponents[0] && opponents[1] && opponents[2]) {
    return [
      { ...opponents[0], position: 'top' as const },
      { ...opponents[1], position: 'left' as const },
      { ...opponents[2], position: 'right' as const }
    ]
  }
  
  return []
})

onMounted(async () => {
  try {
    await gameAPI.fetchPlayerGameState(gameId);
    console.log('mounted game view');
    
    socketGame.onGameStateUpdate((data) => {
      if (data.publicGameState) {
        gameStore.setPublicGameState(data.publicGameState)
      }
      if (data.privateGameState) {
        gameStore.setPrivateGameState(data.privateGameState)
      }
      if (data.event) {
        gameStore.handleGameEvent(data.event)
      }
    });
    
    socketGame.onPrivateStateUpdate((data) => {
      if (data.privateGameState) {
        gameStore.setPrivateGameState(data.privateGameState)
      }
    });
    
  } catch (err) {
    console.error('Error loading game:', err);
    lobbyStore.setError('Failed to load game');
  }
});

onUnmounted(() => {
  socketGame.offGameStateUpdate();
  socketGame.offPrivateStateUpdate();
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
      <PlayerDrawingPhase />
      <Deck />
      <GameStats />
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
      
      <!-- Mano del jugador (fixed en el bottom) -->
      <PlayerHand 
        :cards="playerHand" 
        :mode="handMode"
        @skip-replacement="handleSkipReplacement"
        @confirm-replacement="handleConfirmReplacement"
      />
    </div>
  </GameLayout>
</template>