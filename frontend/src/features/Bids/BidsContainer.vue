<script setup lang="ts">
import type { Bid as BidType } from '@domain/interfaces/Bid'
import Bid from './Bid.vue'

defineProps<{
  bid: BidType | null
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
    <div v-if="bid" class="flex flex-col gap-2">
      <Bid 
        :bid="bid"
      />
    </div>
  </div>
</template>
