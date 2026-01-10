<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue';
import { useSocketLobby } from '../../common/composables/useSocketLobby';
import { useGameStore } from '../../stores/gameStore';
import { userIdService } from '../../services/userIdService';
import type { LobbyGame } from '@domain/interfaces/Game';

const props = defineProps<{
  currentGame: LobbyGame;
  playerId: string;
}>();

const emit = defineEmits<{
  back: [];
  startGame: [];
  leaveGame: [];
}>();

const gameStore = useGameStore();
const socketLobby = useSocketLobby();

const currentPlayers = computed(() => {
  if (gameStore.currentGame) {
    return gameStore.currentGame.currentPlayers;
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
    <button @click="emit('back')" class="btn bg-gray-500 text-white w-full">
      ← Back to menu
    </button>
    
    <div class="text-center">
      <h2 class="text-xl font-bold text-black mb-2">{{ currentGame.gameName }}</h2>
      <p v-if="gameStore.isHost" class="text-hasen-green font-semibold">👑 You are the host</p>
      <p class="text-black font-semibold mt-4">
        Players: {{ currentPlayers }} / {{ currentGame.maxPlayers }}
      </p>
    </div>
    
    <div class="text-center text-gray-500 mt-4">
      Waiting for other players to join...
    </div>

    <!-- Solo el host puede iniciar el juego -->
    <button 
      v-if="gameStore.isHost"
      :disabled="currentPlayers < currentGame.minPlayers"
      class="btn w-full text-white"
      :class="currentPlayers < currentGame.minPlayers ? 'bg-gray-400 cursor-not-allowed' : 'bg-hasen-green'"
      @click="emit('startGame')"
    >
      Start Game
    </button>

    <button 
      class="btn bg-hasen-red text-white w-full"
      @click="emit('leaveGame')"
    >
      {{ gameStore.isHost ? 'Delete Game' : 'Leave Game' }}
    </button>
  </div>
</template>