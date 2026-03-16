<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'
import { initializeSocketListeners, cleanupSocketListeners } from './common/composables/useSocket'
import { useImagePreload } from './common/composables/useImagePreload'
import lobbyBackgroundUrl from './assets/backgrounds/lobby-menu-background.png'

const { preloadImages } = useImagePreload()

onMounted(async () => {
  initializeSocketListeners()
  
  await preloadImages([lobbyBackgroundUrl])
})

onUnmounted(() => {
  cleanupSocketListeners()
})
</script>

<template>
  <div class="min-h-screen bg-hasen-base">
    <main class="">
      <RouterView />
    </main>
  </div>
</template>
