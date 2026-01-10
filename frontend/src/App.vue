<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'
import { initializeSocketListeners, cleanupSocketListeners } from './common/composables/useSocket'

onMounted(() => {
  initializeSocketListeners()
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
