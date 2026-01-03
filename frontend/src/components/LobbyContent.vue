<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useSocket } from '../composables/useSocket';
import { useGameStore } from '../stores/gameStore';
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
const currentPlayers = ref(0);
const socket = useSocket();

const handleHostLeft = (event: any) => {
  const { gameId } = event.detail;
  
  if (gameId === props.currentGame.gameId) {
    alert('The host has left the game. The room has been closed.');
    gameStore.clearCurrentGame();
    emit('back'); // Volver al menú
  }
};
onMounted(() => {
  socket.emit('lobby:join', { gameId: props.currentGame.gameId, playerId: props.playerId });
  
  socket.on('player:joined', ({ playerId }) => {
    console.log('Jugador entró:', playerId);
  });
  
  socket.on('player:left', ({ playerId, currentPlayers: count }) => {
    console.log('Jugador salió:', playerId);
    currentPlayers.value = count;
  });
  // Escuchar cuando el host abandona
  window.addEventListener('game-host-left', handleHostLeft);
});

onUnmounted(() => {
  socket.off('player:joined');
  socket.off('player:left');
  window.removeEventListener('game-host-left', handleHostLeft);
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
      <p v-if="gameStore.isHost" class="text-hasen-green font-semibold">👑 You are the host</p>
      <p class="text-black font-semibold mt-4">
        Players: {{ currentGame.currentPlayers }} / {{ currentGame.maxPlayers }}
      </p>
    </div>
    
    <div class="text-center text-gray-500 mt-4">
      Waiting for other players to join...
    </div>

    <!-- Solo el host puede iniciar el juego -->
    <button 
      v-if="gameStore.isHost"
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
      {{ gameStore.isHost ? 'Delete Game' : 'Leave Game' }}
    </button>
  </div>
</template>