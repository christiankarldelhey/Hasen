<script setup lang="ts">
import SuitSymbol from '@/common/components/SuitSymbol.vue'
import type { SuitDisplay, SetCollectionDisplay } from './composables/useBidPlayerScore'

interface Props {
  suitDisplays: SuitDisplay[]
  setCollectionDisplay?: SetCollectionDisplay | null
}

const props = defineProps<Props>()

const getSuitSymbolClasses = (suitDisplay: SuitDisplay) => [
  !props.setCollectionDisplay ? 'opacity-80' : '',
  !suitDisplay.isWin && !suitDisplay.isAvoid && props.setCollectionDisplay ? 'opacity-70' : ''
]
</script>

<template>
  <div class="flex flex-row items-center justify-between w-full">
    <SuitSymbol 
      v-for="suitDisplay in suitDisplays"
      :key="suitDisplay.suit"
      :suit="suitDisplay.suit" 
      :avoid="suitDisplay.isAvoid"
      :value="suitDisplay.score !== null ? suitDisplay.score : suitDisplay.count"
      :class="getSuitSymbolClasses(suitDisplay)"
    />
    
    <span 
      v-if="setCollectionDisplay"
      class="text-2xl font-semibold mx-2"
      :class="(setCollectionDisplay.winScore + setCollectionDisplay.avoidScore) < 10 ? 'text-hasen-red' : 'text-hasen-green'"
    >
      {{ setCollectionDisplay.winScore + setCollectionDisplay.avoidScore }}
    </span>
  </div>
</template>
