<script setup lang="ts">
import { computed, watch } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import Bid from './Bid.vue'

const gameStore = useGameStore()

const roundBids = computed(() => gameStore.publicGameState?.round.roundBids)

watch(roundBids, (newVal) => {
  console.log('🎯 BidsPanel - roundBids:', newVal)
}, { immediate: true })
</script>

<template>
  <div class="fixed top-4 right-4 z-10">
    <div v-if="roundBids" class="flex flex-col gap-2">
      <Bid 
        :bid="roundBids.points"
        type="points"
      />
      <Bid 
        :bid="roundBids.set_collection"
        type="set_collection"
      />
      <Bid 
        :bid="roundBids.trick"
        type="trick"
      />
    </div>
    <div v-else class="bg-red-500 text-white p-2 rounded">
      No round bids data
    </div>
  </div>
</template>
