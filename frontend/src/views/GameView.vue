<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useSocket } from '../common/composables/useSocket';
import { useGameAPI } from '../common/composables/useGameAPI';
import { useGameStore } from '@/stores/gameStore';
import PlayerHand from '@/features/Players/PlayerHand.vue';
import GameLayout from '../layout/GameLayout.vue';

const route = useRoute();
const socket = useSocket();
const gameId = route.params.gameId as string;
const gameAPI = useGameAPI();
const gameStore = useGameStore();
const playerHand = computed(() => gameStore.privateGameState?.hand || []);

const loading = computed(() => gameStore.loading);
const error = computed(() => gameStore.error);

onMounted(async () => {
  try {
    gameStore.setLoading(true);
    const gameData = await gameAPI.fetchPublicGameState(gameId);
    gameStore.setPublicGameState(gameData);
    
    console.log('mounted game view');
    if (gameData.round.round === 0 && gameData.round.roundPhase === 'round_setup') {
      console.log('round:start en front');
      socket.emit('round:start', { gameId });
    }
  } catch (err) {
    console.error('Error loading game:', err);
    gameStore.setError('Failed to load game');
  } finally {
    gameStore.setLoading(false);
  }
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
      <!-- Aquí irá el contenido del juego (mesa, otras manos, etc.) -->
      
      <!-- Mano del jugador (fixed en el bottom) -->
      <PlayerHand :cards="playerHand" />
    </div>
  </GameLayout>
</template>