<script setup lang="ts">
import { onUnmounted } from 'vue';
import LobbyMenu from '../features/Lobby/LobbyMenu.vue';
import GameLayout from '../layout/GameLayout.vue';
import { useAudio } from '../common/composables/useAudio';

const { stopMusic } = useAudio();

onUnmounted(() => {
  stopMusic();
});
</script>

<template>
  <GameLayout>
    <LobbyMenu />
  </GameLayout>
</template>
