<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useGameStore } from '../stores/gameStore';
import { useGameAPI } from '../composables/useGameAPI';
import PlayingCard from '@/components/PlayingCard.vue';
import GameLayout from '../layout/GameLayout.vue';

const route = useRoute();
const gameStore = useGameStore();
const gameId = route.params.gameId as string;
const gameAPI = useGameAPI();
const gameData = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    gameData.value = await gameAPI.fetchPublicGameState(gameId);
  } catch (err) {
    console.error('Error loading game:', err);
    error.value = 'Failed to load game';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <GameLayout>
    <div class="container mx-auto p-8">
      <div class="max-w-6xl mx-auto">
        <h1 class="text-4xl font-bold text-black mb-6">Game: {{ gameId }}</h1>

        <PlayingCard :card="{
          id: 'test',
          suit: 'acorns',
          char: '6',
          rank: { base: 0, onSuit: null },
          owner: null,
          state: 'in_deck',
          points: 0,
          spritePos: { row: 3, col: 1 }
        }" />

        <PlayingCard :card="{
          id: 'test',
          suit: 'acorns',
          char: '6',
          rank: { base: 0, onSuit: null },
          owner: null,
          state: 'in_deck',
          points: 0,
          spritePos: { row: 5, col: 6 }
        }" />
        
        <div v-if="loading" class="text-center py-12">
          <div class="text-xl text-black">Loading game...</div>
        </div>
        
        <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p class="font-bold">Error</p>
          <p>{{ error }}</p>
        </div>
        
        <div v-else-if="gameData" class="space-y-6">
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-2xl font-bold text-black mb-4">{{ gameData.gameName }}</h2>
            
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="bg-gray-50 p-4 rounded">
                <p class="text-sm text-gray-600">Game Phase</p>
                <p class="text-lg font-semibold text-black">{{ gameData.gamePhase }}</p>
              </div>
              
              <div class="bg-gray-50 p-4 rounded">
                <p class="text-sm text-gray-600">Round</p>
                <p class="text-lg font-semibold text-black">{{ gameData.round?.round || 1 }}</p>
              </div>
              
              <div class="bg-gray-50 p-4 rounded">
                <p class="text-sm text-gray-600">Round Phase</p>
                <p class="text-lg font-semibold text-black">{{ gameData.round?.roundPhase || 'N/A' }}</p>
              </div>
              
              <div class="bg-gray-50 p-4 rounded">
                <p class="text-sm text-gray-600">Players</p>
                <p class="text-lg font-semibold text-black">{{ gameData.activePlayers?.length || 0 }}</p>
              </div>
            </div>

            <div class="mb-6">
              <h3 class="text-xl font-bold text-black mb-3">Your Player ID</h3>
              <p class="text-lg text-hasen-green font-semibold">{{ gameStore.currentPlayerId }}</p>
            </div>
            
            <div>
              <h3 class="text-xl font-bold text-black mb-3">Active Players</h3>
              <div class="space-y-2">
                <div 
                  v-for="player in gameData.activePlayers" 
                  :key="player" 
                  class="flex items-center justify-between bg-gray-50 p-3 rounded"
                >
                  <span class="font-semibold text-black">{{ player }}</span>
                  <span 
                    v-if="player === gameStore.currentPlayerId" 
                    class="bg-hasen-green text-white px-3 py-1 rounded-full text-sm"
                  >
                    You
                  </span>
                  <span 
                    v-else-if="player === gameData.hostPlayer" 
                    class="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm"
                  >
                    Host
                  </span>
                </div>
              </div>
            </div>

            <div v-if="gameData.playerTurnOrder && gameData.playerTurnOrder.length > 0" class="mt-6">
              <h3 class="text-xl font-bold text-black mb-3">Turn Order</h3>
              <div class="flex gap-2">
                <span 
                  v-for="(player, index) in gameData.playerTurnOrder" 
                  :key="player"
                  class="bg-blue-100 text-blue-800 px-3 py-1 rounded"
                >
                  {{ Number(index) + 1 }}. {{ player }}
                </span>
              </div>
            </div>
          </div>

          <div class="bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-3 rounded">
            <p class="font-semibold">🎮 Game in progress</p>
            <p class="text-sm">Gameplay features coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  </GameLayout>
</template>