<script setup lang="ts">
import RoundInfo from './RoundInfo.vue'
import Deck from './Deck.vue'
import GamePanel from '@/common/components/GamePanel.vue'
</script>

<template>
  <GamePanel class="fixed top-0 left-0 z-10 px-4 pt-4 m-4">
    <div class="flex flex-row gap-4 p-2">
      <Deck />
      <RoundInfo />
    </div>
  </GamePanel>
</template>
