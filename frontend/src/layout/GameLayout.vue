<script setup lang="ts">
import backgroundImage from '@/assets/backgrounds/game-background-6.png'
</script>

<template>
  <div 
    class="h-screen bg-cover bg-center bg-no-repeat bg-fixed opacity-90 flex items-center justify-center" 
    :style="{ backgroundImage: `url(${backgroundImage})` }"
  >
    <slot />
  </div>
</template>