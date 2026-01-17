<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue';
import { useSocketLobby } from '../../common/composables/useSocketLobby';
import { useLobbyStore } from '../../stores/lobbyStore';
import { userIdService } from '../../services/userIdService';
import type { LobbyGame } from '@domain/interfaces/Game';
import ActionButton from '@/common/components/ActionButton.vue';

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
      label="← Back to menu" 
      variant="primary"
      @click="emit('back')"
    />
    
    <div class="text-center">
      <h2 class="text-xl font-bold text-black mb-2">{{ currentGame.gameName }}</h2>
      <p v-if="lobbyStore.isHost(playerId)" class="text-hasen-green font-semibold">👑 You are the host</p>
      <p class="text-black font-semibold mt-4">
        Players: {{ currentPlayers }} / {{ currentGame.maxPlayers }}
      </p>
    </div>
    
    <div class="text-center text-gray-500 mt-4">
      Waiting for other players to join...
    </div>

    <ActionButton 
      v-if="lobbyStore.isHost(playerId)"
      label="Start Game"
      variant="primary"
      :disabled="currentPlayers < currentGame.minPlayers"
      @click="emit('startGame')"
    />

    <ActionButton 
      :label="lobbyStore.isHost(playerId) ? 'Delete Game' : 'Leave Game'"
      variant="danger"
      @click="emit('leaveGame')"
    />
  </div>
</template>