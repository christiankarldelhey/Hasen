<script setup lang="ts">
import { onUnmounted } from 'vue';
import LobbyMenu from '../features/Lobby/LobbyMenu.vue';
import GameLayout from '../layout/GameLayout.vue';
import { useAudio } from '../common/composables/useAudio';
import { useIsMobile } from '@/common/composables/useIsMobile';

const { stopMusic } = useAudio();
const isMobile = useIsMobile();

onUnmounted(() => {
  stopMusic();
});
</script>

<template>
  <!-- En mobile el panel ocupa toda la pantalla: sin fondo de madera scrolleable -->
  <div v-if="isMobile" class="h-dvh overflow-hidden bg-hasen-base">
    <LobbyMenu />
  </div>
  <GameLayout v-else>
    <LobbyMenu />
  </GameLayout>
</template>
