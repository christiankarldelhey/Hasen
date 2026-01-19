<script setup lang="ts">
import type { LobbyGame } from '@domain/interfaces/Game';
import ActionButton from '@/common/components/ActionButton.vue';
import RabbitLoader from '@/common/components/RabbitLoader.vue';

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
    <ActionButton 
      label="Create new game"
      variant="primary"
      @click="emit('gameSettings')"
    />
    
    <h2 class="text-center text-md font-semibold text-black mt-4">Join game</h2>
    
    <div v-if="loading">
      <RabbitLoader size="xl" />
    </div>
    
    <div v-else-if="error" class="text-center text-red-600">
      {{ error }}
    </div>
    
    <div v-else-if="games.length === 0" class="text-center text-gray-600">
      There are no available games at the moment.
    </div>
    
    <div 
      v-for="game in games" 
      :key="game.gameId"
      class="w-full"
    >
      <ActionButton 
        :label="`${game.gameName} - ${joiningGameId === game.gameId ? 'Joining...' : game.currentPlayers + '/' + game.maxPlayers + ' players'}`"
        variant="primary"
        :disabled="!game.hasSpace || joiningGameId === game.gameId"
        @click="emit('joinGame', game.gameId)"
      />
    </div>
  </div>
</template>