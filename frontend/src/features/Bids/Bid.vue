<script setup lang="ts">
import type { Bid as BidType } from '@domain/interfaces/Bid'

defineProps<{
  bid: BidType
}>()
</script>

<template>
  <div class="bg-hasen-base rounded-2xl px-4 py-3 shadow-lg">
    <div class="flex flex-row">
      <div class="text-hasen-dark text-sm font-semibold">
        Bid ID: {{ bid?.bid_id }}
      </div>
      <div class="text-hasen-dark text-sm font-semibold">
        Bid ID: {{ bid?.bid_id }}
      </div>
    </div>
  </div>
</template>
