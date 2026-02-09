<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue';
import { useSocketLobby } from '../../common/composables/useSocketLobby';
import { useLobbyStore } from '../../stores/lobbyStore';
import { userIdService } from '../../services/userIdService';
import type { LobbyGame } from '@domain/interfaces/Game';
import ActionButton from '@/common/components/ActionButton.vue';
import { useI18n } from '@/common/composables/useI18n';

const props = defineProps<{
  currentGame: LobbyGame;
  playerId: string;
}>();

const emit = defineEmits<{
  back: [];
  startGame: [];
  leaveGame: [];
}>();

const lobbyStore = useLobbyStore();
const socketLobby = useSocketLobby();
const { t } = useI18n();

const currentPlayers = computed(() => {
  if (lobbyStore.currentRoom) {
    return lobbyStore.currentRoom.currentPlayers;
  }
  return props.currentGame.currentPlayers;
});

onMounted(() => {
  const userId = userIdService.getUserId();
  socketLobby.joinLobby({ 
    gameId: props.currentGame.gameId, 
    playerId: props.playerId as import('@domain/interfaces/Player').PlayerId,
    userId 
  });
  
  socketLobby.onGameDeleted(({ message }) => {
    alert(message || 'The host has left. Game deleted.');
    emit('back');
  });
});

onUnmounted(() => {
  socketLobby.offGameDeleted();
});

</script>

<template>
  <div class="flex flex-col gap-4">
    <ActionButton 
      :label="t('lobby.backToMenu')" 
      variant="primary"
      @click="emit('back')"
    />
    
    <div class="text-center">
      <h2 class="text-xl font-bold text-black mb-2">{{ currentGame.gameName }}</h2>
      <p v-if="lobbyStore.isHost(playerId)" class="text-hasen-green font-semibold">{{ t('lobby.youAreHost') }}</p>
      <p class="text-black font-semibold mt-4">
        {{ t('lobby.players') }}: {{ currentPlayers }} / {{ currentGame.maxPlayers }}
      </p>
    </div>
    
    <div class="text-center text-gray-500 mt-4">
      {{ t('lobby.waitingForPlayers') }}
    </div>

    <ActionButton 
      v-if="lobbyStore.isHost(playerId)"
      :label="t('lobby.startGame')"
      variant="primary"
      :disabled="currentPlayers < currentGame.minPlayers"
      @click="emit('startGame')"
    />

    <ActionButton 
      :label="lobbyStore.isHost(playerId) ? t('lobby.deleteGame') : t('lobby.leaveGame')"
      variant="danger"
      @click="emit('leaveGame')"
    />
  </div>
</template>