<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { gameService } from '../services/gameService';

const route = useRoute();
const gameId = route.params.gameId as string;
const playerId = sessionStorage.getItem('current_player_id');

onMounted(() => {
  console.log('Joined lobby:', gameId, 'as player:', playerId);
});

onBeforeUnmount(async () => {
  // Cuando el usuario sale del lobby (atrás, cierra pestaña, etc.)
  if (gameId && playerId) {
    try {
      await gameService.leaveGame(gameId, playerId);
      console.log('Left game:', gameId);
      
      // Limpiar sessionStorage
      sessionStorage.removeItem('current_player_id');
      sessionStorage.removeItem('current_game_id');
    } catch (error) {
      console.error('Error leaving game:', error);
    }
  }
});
</script>

<template>
  <div>
    <h1>Lobby View</h1>
    <p>Game ID: {{ gameId }}</p>
    <p>Player ID: {{ playerId }}</p>
  </div>
</template>