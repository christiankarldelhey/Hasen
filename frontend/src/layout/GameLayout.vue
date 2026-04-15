<script setup lang="ts">
import backgroundImageWebP from '@/assets/backgrounds/game-background-7.webp'
// import backgroundImagePNG from '@/assets/backgrounds/game-background-7.png' // Fallback available if needed

// Use WebP (95KB vs 716KB PNG)
const backgroundImage = backgroundImageWebP
</script>

<template>
  <div 
    class="h-screen bg-cover bg-center bg-no-repeat bg-fixed opacity-90 flex items-center justify-center" 
    :style="{ backgroundImage: `url(${backgroundImage})` }"
  >
    <slot />
  </div>
</template>