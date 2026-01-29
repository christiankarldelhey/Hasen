<script setup lang="ts">
import CrownSymbol from '@/assets/symbols/trick-win.png'
import WinPointsSymbol from '@/assets/symbols/win-symbol.png'
import SetCollectionSymbol from '@/assets/symbols/set-collection.png'
import type { Suit } from '@domain/interfaces/Card'
import SuitSymbol from '@/common/components/SuitSymbol.vue'

const props = defineProps<{
  type: 'tricks' | 'points' | 'setCollection'
  isActive: boolean
  playerColor: string
  score: number | null
  onLose: number | null
  showLose?: boolean
  winSuit?: Suit | null
  avoidSuit?: Suit | null
}>()

const iconMap = {
  tricks: CrownSymbol,
  points: WinPointsSymbol,
  setCollection: SetCollectionSymbol
}
</script>

<template>
  <div class="flex items-center justify-center min-w-[60px] h-full border-r border-hasen-dark transition-colors bg-transparent"
  >
    <img
      v-if="!isActive"
      :src="iconMap[type]"
      :alt="type"
      class="h-6 w-6 object-contain opacity-60"
      style="filter: brightness(0);"
    />

    <div v-else class="flex flex-col items-center gap-1 w-[60px] h-full py-1 px-3">
        <!-- Win Scoring -->
        <div v-if="score !== null" class="flex flex-row items-center justify-center gap-0.5 w-full">
          <div v-if="type === 'tricks'" class="relative flex-shrink-0">
            <img
              class="h-5 w-5 object-contain"
              :src="CrownSymbol"
              alt="crown win"
            />
          </div>

          <div v-if="type === 'points'" class="relative flex-shrink-0">
            <img
              class="h-5 w-5 object-contain"
              :src="WinPointsSymbol"
              alt="crown win"
            />
          </div>
          
          <template v-if="type === 'setCollection' && winSuit" >
            <SuitSymbol :suit="winSuit" size="small" />
          </template>

          <span class="text-lg font-semibold text-hasen-green w-6 text-center">
            {{ score }}
          </span>
        </div>

        <!-- Lose Scoring (crossed out) -->
        <div v-if="onLose !== null && showLose" class="flex flex-row items-center justify-center gap-0.5 w-full">
          <div v-if="!avoidSuit" class="relative flex-shrink-0">
            <img
              v-if="type === 'tricks'"
              class="h-5 w-5 object-contain"
              :src="CrownSymbol"
              alt="crown lose"
            />
            <img
              v-if="type === 'points'"
              class="h-5 w-5 object-contain"
              :src="WinPointsSymbol"
              alt="crown lose"
            />
            <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="0" y1="0" x2="100" y2="100" 
                stroke="#dc2626" stroke-width="5" />
            </svg>
          </div>
          
          <template v-if="type === 'setCollection' && avoidSuit">
            <SuitSymbol :suit="avoidSuit" size="small" />
          </template>
          <span class="text-lg font-semibold text-hasen-red w-6 text-center">
            {{ onLose }}
          </span>
        </div>
      </div>
    </div>

</template>
