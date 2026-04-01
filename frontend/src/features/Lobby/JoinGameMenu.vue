<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';
import type { LobbyGame } from '@domain/interfaces/Game';
import ActionButton from '@/common/components/ActionButton.vue';
import RabbitLoader from '@/common/components/RabbitLoader.vue';
import { useI18n } from '@/common/composables/useI18n';

const props = defineProps<{
  games: LobbyGame[];
  loading: boolean;
  error: string | null;
  joiningGameId: string | null;
}>();

const emit = defineEmits<{
  joinGame: [gameId: string];
}>();

const { t } = useI18n();
const showSlowLoadingMessage = ref(false);
let slowLoadingTimeout: ReturnType<typeof setTimeout> | null = null;

watch(
  () => props.joiningGameId,
  (joiningGameId) => {
    if (slowLoadingTimeout) {
      clearTimeout(slowLoadingTimeout);
      slowLoadingTimeout = null;
    }

    if (joiningGameId) {
      showSlowLoadingMessage.value = false;
      slowLoadingTimeout = setTimeout(() => {
        showSlowLoadingMessage.value = true;
      }, 5000);
      return;
    }

    showSlowLoadingMessage.value = false;
  }
);

onUnmounted(() => {
  if (slowLoadingTimeout) {
    clearTimeout(slowLoadingTimeout);
  }
});
</script>

<template>
  <div class="flex flex-col gap-4" data-testid="join-game-menu">
    <div v-if="loading" data-testid="join-game-loading">
      <RabbitLoader size="xl" />
    </div>
    
    <div v-else-if="error" class="text-center text-red-600" data-testid="join-game-error">
      {{ error }}
    </div>
    
    <div v-else-if="games.length === 0" class="text-center text-gray-600" data-testid="join-game-empty">
      {{ t('lobby.noGamesAvailable') }}
    </div>
    
    <div 
      v-for="game in games" 
      :key="game.gameId"
      class="w-full"
      :data-testid="`join-game-item-${game.gameId}`"
    >
      <ActionButton 
        :data-testid="`join-game-action-${game.gameId}`"
        :label="joiningGameId === game.gameId ? t('lobby.joining') : `${game.gameName} (${game.currentPlayers}/${game.maxPlayers} - ${t('lobby.pointsToWinLabel', { points: game.pointsToWin || 300 })})`"
        variant="primary"
        :disabled="!game.hasSpace || joiningGameId === game.gameId"
        @click="emit('joinGame', game.gameId)"
      />
    </div>

    <div v-if="joiningGameId" class="mt-6 flex flex-col items-center gap-4" data-testid="join-game-joining-loader">
      <RabbitLoader size="lg" />
      <p v-if="showSlowLoadingMessage" class="text-sm text-hasen-dark text-center font-semibold">
        {{ t('lobby.serverStarting') }}
      </p>
    </div>
  </div>
</template>
