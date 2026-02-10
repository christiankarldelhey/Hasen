<script setup lang="ts">
import type { LobbyGame } from '@domain/interfaces/Game';
import ActionButton from '@/common/components/ActionButton.vue';
import RabbitLoader from '@/common/components/RabbitLoader.vue';
import { useI18n } from '@/common/composables/useI18n';

defineProps<{
  games: LobbyGame[];
  loading: boolean;
  error: string | null;
  joiningGameId: string | null;
}>();

const emit = defineEmits<{
  joinGame: [gameId: string];
}>();

const { t } = useI18n();
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="loading">
      <RabbitLoader size="xl" />
    </div>
    
    <div v-else-if="error" class="text-center text-red-600">
      {{ error }}
    </div>
    
    <div v-else-if="games.length === 0" class="text-center text-gray-600">
      {{ t('lobby.noGamesAvailable') }}
    </div>
    
    <div 
      v-for="game in games" 
      :key="game.gameId"
      class="w-full"
    >
      <ActionButton 
        :label="joiningGameId === game.gameId ? 'Joining...' : `${game.gameName} (${game.currentPlayers}/${game.maxPlayers} - ${game.pointsToWin || 300}pts)`"
        variant="primary"
        :disabled="!game.hasSpace || joiningGameId === game.gameId"
        @click="emit('joinGame', game.gameId)"
      />
    </div>
  </div>
</template>
