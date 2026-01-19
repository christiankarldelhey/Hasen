<script setup lang="ts">
import RoundInfo from './RoundInfo.vue'
import Deck from './Deck.vue'
</script>

<template>
  <div class="fixed top-4 left-4 z-10">
    <div class="flex flex-row gap-4">
      <RoundInfo />
      <Deck />
    </div>
  </div>
</template>
