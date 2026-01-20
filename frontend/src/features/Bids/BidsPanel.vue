<script setup lang="ts">
import { computed, watch } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import Bid from './Bid.vue'

const gameStore = useGameStore()

const roundBids = computed(() => {
  const allBids = gameStore.publicGameState?.round.roundBids.bids || []
  
  return {
    pointsBids: allBids.filter(b => b.bid_type === 'points'),
    setCollectionBids: allBids.filter(b => b.bid_type === 'set_collection'),
    trickBids: allBids.filter(b => b.bid_type === 'trick')
  }
})

watch(roundBids, (newVal) => {
  console.log('🎯 BidsPanel - roundBids:', newVal)
}, { immediate: true })
</script>

<template>
  <div class="fixed top-0 right-0 rounded-xl bg-black/60 p-4 z-10">
    <div v-if="roundBids" class="flex flex-col gap-2">
      <!-- Fila de Points (2 bids) -->
      <div class="flex flex-row gap-2">
        <Bid 
          v-for="(bid, index) in roundBids.pointsBids"
          :key="`points-${index}`"
          :bid="bid"
          type="points"
        />
      </div>
      
      <!-- Fila de Set Collection / set collection (2 bids) -->
      <div class="flex flex-row gap-2">
        <Bid 
          v-for="(bid, index) in roundBids.setCollectionBids"
          :key="`set-collection-${index}`"
          :bid="bid"
          type="set_collection"
        />
      </div>
      
      <!-- Fila de Tricks / tricks (2 bids) -->
      <div class="flex flex-row gap-2">
        <Bid 
          v-for="(bid, index) in roundBids.trickBids"
          :key="`trick-${index}`"
          :bid="bid"
          type="trick"
        />
      </div>
    </div>
    <div v-else class="bg-red-500 text-white p-2 rounded">
      No round bids data
    </div>
  </div>
</template>
