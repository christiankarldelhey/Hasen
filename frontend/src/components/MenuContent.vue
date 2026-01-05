<script setup lang="ts">
import type { LobbyGame } from '@domain/interfaces/Game';

defineProps<{
  games: LobbyGame[];
  loading: boolean;
  error: string | null;
  joiningGameId: string | null;
}>();

const emit = defineEmits<{
  gameSettings: [];
  joinGame: [gameId: string];
}>();
</script>

<template>
  <div class="flex flex-col gap-4">
    <button @click="emit('gameSettings')" class="btn bg-hasen-green text-white w-full">
      Create new game
    </button>
    
    <h2 class="text-center text-md font-semibold text-black mt-4">Join game</h2>
    
    <div v-if="loading" class="text-center text-gray-600">
      Fetching games...
    </div>
    
    <div v-else-if="error" class="text-center text-red-600">
      {{ error }}
    </div>
    
    <div v-else-if="games.length === 0" class="text-center text-gray-600">
      There are no available games at the moment.
    </div>
    
    <button 
      v-for="game in games" 
      :key="game.gameId"
      @click="emit('joinGame', game.gameId)"
      class="btn bg-hasen-green text-white w-full flex flex-row justify-between items-center"
      :disabled="!game.hasSpace || joiningGameId === game.gameId"
      :class="{ 'opacity-50 cursor-not-allowed': !game.hasSpace || joiningGameId === game.gameId }"
    >
      <span class="font-semibold">{{ game.gameName }}</span>
      <span class="text-sm">
        {{ joiningGameId === game.gameId ? 'Joining...' : `${game.currentPlayers}/${game.maxPlayers} players` }}
      </span>
    </button>
  </div>
</template>