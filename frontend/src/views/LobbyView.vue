<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useSocket } from '../composables/useSocket';

const route = useRoute();
const gameId = route.params.gameId as string;
const playerId = sessionStorage.getItem('current_player_id');
const currentPlayers = ref(0);

onMounted(() => {
  const socket = useSocket();
  
  // Unirse al lobby
  socket.emit('lobby:join', { gameId, playerId });
  
  // Escuchar cuando otros se unen/salen
  socket.on('player:joined', ({ playerId }) => {
    console.log('Jugador entró:', playerId);
  });
  
  socket.on('player:left', ({ playerId, currentPlayers: count }) => {
    console.log('Jugador salió:', playerId);
    currentPlayers.value = count;
  });
});
</script>

<template>
  <div>
    <h1>Lobby</h1>
    <p>Game ID: {{ gameId }}</p>
    <p>Player ID: {{ playerId }}</p>
    <p v-if="currentPlayers">Jugadores: {{ currentPlayers }}</p>
  </div>
</template>