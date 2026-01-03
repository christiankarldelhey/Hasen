<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { useSocket } from '../composables/useSocket';
import type { LobbyGame } from '@domain/interfaces/Game';

const props = defineProps<{
  gameName: string;
  currentGame: LobbyGame;
  playerId: string;
  assignedPlayerId: string;
}>();

const emit = defineEmits<{
  back: [];
  startGame: [];
  leaveGame: [];
}>();

const currentPlayers = ref(0);
const socket = useSocket();

// Computed property para verificar si es el host
const isHost = computed(() => props.currentGame.hostPlayer === props.playerId);

onMounted(() => {
  socket.emit('lobby:join', { gameId: props.currentGame.gameId, playerId: props.playerId });
  
  socket.on('player:joined', ({ playerId }) => {
    console.log('Jugador entró:', playerId);
  });
  
  socket.on('player:left', ({ playerId, currentPlayers: count }) => {
    console.log('Jugador salió:', playerId);
    currentPlayers.value = count;
  });
});

onUnmounted(() => {
  socket.off('player:joined');
  socket.off('player:left');
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <button @click="emit('back')" class="btn bg-gray-500 text-white w-full">
      ← Back to menu
    </button>
    
    <div class="text-center">
      <h2 class="text-xl font-bold text-black mb-2">{{ currentGame.gameName }}</h2>
      <p class="text-gray-600">Game ID: {{ currentGame.gameId }}</p>
      <p v-if="isHost" class="text-hasen-green font-semibold">👑 You are the host</p>
      <p class="text-black font-semibold mt-4">
        Players: {{ currentGame.currentPlayers }} / {{ currentGame.maxPlayers }}
      </p>
    </div>
    
    <div class="text-center text-gray-500 mt-4">
      Waiting for other players to join...
    </div>

    <!-- Solo el host puede iniciar el juego -->
    <button 
      v-if="isHost"
      :disabled="currentGame.currentPlayers < currentGame.minPlayers"
      class="btn w-full text-white"
      :class="currentGame.currentPlayers < currentGame.minPlayers ? 'bg-gray-400 cursor-not-allowed' : 'bg-hasen-green'"
      @click="emit('startGame')"
    >
      Start Game
    </button>

    <button 
      class="btn bg-hasen-red text-white w-full"
      @click="emit('leaveGame')"
    >
      {{ isHost ? 'Delete Game' : 'Leave Game' }}
    </button>
  </div>
</template>