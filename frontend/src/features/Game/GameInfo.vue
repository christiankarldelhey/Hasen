<script setup lang="ts">
import GameScores from './GameScores.vue'
import Deck from './Deck.vue'
import GamePanel from '@/common/components/GamePanel.vue'


</script>

<template>
  <GamePanel class="fixed top-0 left-0 z-10 px-4 m-4">
    <div class="flex flex-col gap-1">
      <div class="flex flex-row gap-2 px-2">
        <div class="flex flex-col gap-1">
          <div class="flex flex-row gap-2"></div>
          <Deck />
        </div>
        <GameScores />
      </div>
    </div>
  </GamePanel>
</template>
