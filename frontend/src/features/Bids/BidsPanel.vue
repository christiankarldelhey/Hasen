<script setup lang="ts">
import { computed, watch } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import BidsContainer from './BidsContainer.vue'

const gameStore = useGameStore()

const roundBids = computed(() => gameStore.publicGameState?.round.roundBids)

watch(roundBids, (newVal) => {
  console.log('🎯 BidsPanel - roundBids:', newVal)
}, { immediate: true })
</script>

<template>
  <div class="fixed top-4 right-4 z-10">
    <div v-if="roundBids" class="flex flex-col gap-1">
      <BidsContainer 
        :bid="roundBids.points"
        type="points"
      />
      <BidsContainer 
        :bid="roundBids.set_collection"
        type="set_collection"
      />
      <BidsContainer 
        :bid="roundBids.trick"
        type="trick"
      />
    </div>
    <div v-else class="bg-red-500 text-white p-2 rounded">
      No roundBids data
    </div>
  </div>
</template>
