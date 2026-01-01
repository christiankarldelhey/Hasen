<script setup lang="ts">
import GameMenu from '../components/GameMenu.vue';
</script>

<template>
  <div class="min-h-[calc(100vh-73px)] bg-cover bg-center bg-no-repeat bg-fixed opacity-90 flex items-center justify-center" 
       style="background-image: url('/src/assets/backgrounds/background.png')">
       <GameMenu />
  </div>
</template>
