<script setup lang="ts">
import type { Bid as BidType } from '@domain/interfaces/Bid'
import Bid from './Bid.vue'

defineProps<{
  bids: [BidType, BidType]
  type: 'points' | 'set_collection' | 'trick'
}>()

const typeLabels = {
  points: 'Points',
  set_collection: 'Set Collection',
  trick: 'Tricks'
}
</script>

<template>
  <div class="mb-3">
    <div class="flex flex-col gap-2">
      <Bid 
        v-for="bid in bids" 
        :key="bid?.bid_id"
        :bid="bid"
      />
    </div>
  </div>
</template>
