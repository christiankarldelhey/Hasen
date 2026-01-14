<script setup lang="ts">
import PlayerGameInfo from '@/features/Players/PlayerGameInfo.vue'
import GameStats from './GameStats.vue'
</script>

<template>
  <div class="fixed top-4 left-[140px] z-10 w-[280px]">
    <div class="relative space-y-4">
      <PlayerGameInfo />
      <GameStats />
    </div>
  </div>
</template>
