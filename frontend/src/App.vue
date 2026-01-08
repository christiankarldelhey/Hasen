<script setup lang="ts">
import { RouterView } from 'vue-router'
// import { useGameStore } from './stores/gameStore'

// const gameStore = useGameStore()
</script>

<template>
  <div class="min-h-screen bg-hasen-base">
    <!-- Header global -->
    <!-- <header class="p-4 border-b border-slate-700">
      <div class="container mx-auto flex justify-between items-center">
        <h1 class="text-3xl text-black font-bold">Hasen</h1>
      </div>
    </header> -->
    <main class="">
      <RouterView />
    </main>
  </div>
</template>
