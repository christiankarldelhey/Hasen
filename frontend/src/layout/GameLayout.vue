<script setup lang="ts">
import backgroundImageWebP from '@/assets/backgrounds/game-background-7.webp'
// import backgroundImagePNG from '@/assets/backgrounds/game-background-7.png' // Fallback available if needed

// Use WebP (95KB vs 716KB PNG)
const backgroundImage = backgroundImageWebP

const props = withDefaults(defineProps<{
  /** Fija el fondo al viewport: evita que la madera haga scroll/rebote en mobile */
  fixed?: boolean
}>(), {
  fixed: false
})
</script>

<template>
  <div 
    :class="[
      'bg-cover bg-center bg-no-repeat bg-fixed opacity-90 flex items-center justify-center overscroll-none',
      props.fixed ? 'fixed inset-0 overflow-hidden' : 'h-dvh'
    ]"
    :style="{ backgroundImage: `url(${backgroundImage})` }"
  >
    <slot />
  </div>
</template>
