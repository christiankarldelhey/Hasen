<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useGameAPI } from '../composables/useGameAPI';
import PlayingCard from '@/components/PlayingCard.vue';
import GameLayout from '../layout/GameLayout.vue';

const route = useRoute();
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
        <div class="row flex gap-4">
            <PlayingCard :card="{
            id: 'test',
            suit: 'acorns',
            char: '6',
            rank: { base: 0, onSuit: null },
            owner: null,
            state: 'in_deck',
            points: 0,
            spritePos: { row: 3, col: 8 }
          }" />

          <PlayingCard :card="{
            id: 'test',
            suit: 'acorns',
            char: '6',
            rank: { base: 0, onSuit: null },
            owner: null,
            state: 'in_deck',
            points: 0,
            spritePos: { row: 2, col: 5 }
          }" />
           <PlayingCard :card="{
            id: 'test',
            suit: 'acorns',
            char: '6',
            rank: { base: 0, onSuit: null },
            owner: null,
            state: 'in_deck',
            points: 0,
            spritePos: { row: 3, col: 4 }
          }" />
           <PlayingCard :card="{
            id: 'test',
            suit: 'acorns',
            char: '6',
            rank: { base: 0, onSuit: null },
            owner: null,
            state: 'in_deck',
            points: 0,
            spritePos: { row: 1, col: 8 }
          }" />
          <PlayingCard :card="{
            id: 'test',
            suit: 'acorns',
            char: '6',
            rank: { base: 0, onSuit: null },
            owner: null,
            state: 'in_deck',
            points: 0,
            spritePos: { row: 3, col: 5 }
          }" />
          <PlayingCard :card="{
            id: 'test',
            suit: 'acorns',
            char: '6',
            rank: { base: 0, onSuit: null },
            owner: null,
            state: 'in_deck',
            points: 0,
            spritePos: { row: 0, col: 3 }
          }" />
        <div>
        
        
        <div v-if="loading" class="text-center py-12">
          <div class="text-xl text-black">Loading game...</div>
        </div>
        
        <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p class="font-bold">Error</p>
          <p>{{ error }}</p>
        </div>
      
        </div>
      </div>
    </div>
  </GameLayout>
</template>