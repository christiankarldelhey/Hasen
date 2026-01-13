<script setup lang="ts">
import type { Bid } from '@domain/interfaces/Bid'
import Hare from '../../common/components/Hare.vue'
import WinCondition from './WinCondition.vue'

defineProps<{
  bid: Bid | null
}>()
</script>

<template>
  <div v-if="bid" class="bg-hasen-base rounded-2xl px-2 py-3 shadow-lg max-h-20 cursor-pointer">
    <div class="flex flex-row">
       <div class="avatar avatar-placeholder">
        <div class="bg-hasen-green w-12 h-12 rounded-full border-2 border-hasen-dark">
          <span class="text-2xl text-hasen-dark">{{ bid?.bid_score }}</span>
        </div>
      </div>
      <WinCondition :type="bid?.bid_type" :win_condition="bid?.win_condition" />
    </div>
  </div>
</template>
