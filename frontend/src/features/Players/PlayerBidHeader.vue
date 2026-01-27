<script setup lang="ts">
import CrownSymbol from '@/assets/symbols/trick-win.png'
import WinPointsSymbol from '@/assets/symbols/win-points.png'
import SetCollectionSymbol from '@/assets/symbols/set-collection.png'

const props = defineProps<{
  type: 'tricks' | 'points' | 'setCollection'
  isActive: boolean
  playerColor: string
}>()

const iconMap = {
  tricks: CrownSymbol,
  points: WinPointsSymbol,
  setCollection: SetCollectionSymbol
}
</script>

<template>
  <div 
    class="flex items-center justify-center min-w-[60px] h-full border-r border-hasen-dark transition-colors"
    :style="{ backgroundColor: isActive ? playerColor : 'transparent' }"
  >
    <img
      :src="iconMap[type]"
      :alt="type"
      class="h-6 w-6 object-contain"
      style="filter: brightness(0);"
    />
  </div>
</template>
