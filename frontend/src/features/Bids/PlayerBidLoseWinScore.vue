<script setup lang="ts">
import CrownSymbol from '@/assets/symbols/crown.svg'
import SuitSymbol from '@/common/components/SuitSymbol.vue'
import type { Suit } from '@domain/interfaces/Card'

const props = withDefaults(defineProps<{
  score: number | null
  onLose: number | null
  showLose?: boolean
  winSuit?: Suit | null
  avoidSuit?: Suit | null
}>(), {
  showLose: false,
  winSuit: null,
  avoidSuit: null
})
</script>

<template>
  <div class="flex flex-col items-center gap-1 min-w-[60px] py-1 px-3 border-l border-hasen-dark">
    <!-- Win Crown -->
    <div v-if="score !== null" class="flex flex-row items-center justify-center gap-0.5 w-full">
      <div v-if="!avoidSuit" class="relative h-6 w-6 flex-shrink-0">
        <img
          class="h-6 w-6 object-contain"
          :src="CrownSymbol"
          alt="crown win"
        />
      </div>
      
      <template v-if="winSuit">
        <SuitSymbol :suit="winSuit" size="small" />
      </template>
      <span class="text-lg font-semibold text-hasen-green w-6 text-center">
        {{ score }}
      </span>
    </div>

    <!-- Lose Crown (crossed out) -->
    <div v-if="onLose !== null && showLose" class="flex flex-row items-center justify-center gap-0.5 w-full">
      <div v-if="!avoidSuit" class="relative h-6 w-6 flex-shrink-0">
        <img
          class="h-6 w-6 object-contain"
          :src="CrownSymbol"
          alt="crown lose"
        />
        <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="0" y1="0" x2="100" y2="100" 
            stroke="#dc2626" stroke-width="5" />
        </svg>
      </div>
      
      <template v-if="avoidSuit">
        <SuitSymbol :suit="avoidSuit" size="small" />
      </template>
      <span class="text-lg font-semibold text-hasen-red w-6 text-center">
        {{ onLose }}
      </span>
    </div>
  </div>
</template>
