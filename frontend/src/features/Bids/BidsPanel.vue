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
      <!-- Fila de Points (2 bids) -->
      <div class="flex flex-row gap-2">
        <Bid 
          v-for="(bid, index) in roundBids.pointsBids"
          :key="`points-${index}`"
          :bid="bid"
          type="points"
        />
      </div>
      
      <!-- Fila de Set Collection / Carrots (2 bids) -->
      <div class="flex flex-row gap-2">
        <Bid 
          v-for="(bid, index) in roundBids.setCollectionBids"
          :key="`set-collection-${index}`"
          :bid="bid"
          type="set_collection"
        />
      </div>
      
      <!-- Fila de Tricks / Lettuce (2 bids) -->
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
