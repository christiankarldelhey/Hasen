<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import acornIcon from '@/assets/symbols/acorn.png'
import berryIcon from '@/assets/symbols/berry.png'
import leaveIcon from '@/assets/symbols/leave.png'
import trickIcon from '@/assets/symbols/trick.png'

const gameStore = useGameStore()

const currentTrick = computed(() => gameStore.publicGameState?.round.currentTrick)
const leadSuit = computed(() => currentTrick.value?.lead_suit)
const trickNumber = computed(() => currentTrick.value?.trick_number)

const suitIcons: Record<string, string> = {
  'acorns': acornIcon,
  'berries': berryIcon,
  'leaves': leaveIcon
}

const leadSuitIcon = computed(() => {
  if (!leadSuit.value) return null
  return suitIcons[leadSuit.value]
})

const _bidStatus = computed(() => {
  if (!trickNumber.value) return ''
  if (trickNumber.value >= 1 && trickNumber.value <= 3) {
    return '(can make bids)'
  } else if (trickNumber.value >= 4 && trickNumber.value <= 5) {
    return '(cant make bids)'
  }
  return ''
})
</script>

<template>
  <div class="bg-transparent flex flex-col gap-5">
      <div v-if="currentTrick" class="bg-hasen-base rounded-full px-2 py-2 shadow-lg flex items-center justify-center">
          <div v-if="leadSuitIcon" class="w-8 h-8 flex items-center justify-center">
            <img 
              :src="leadSuitIcon" 
              alt="Lead suit" 
              class="w-full h-full object-contain" 
            />
          </div>
          <div v-else class="w-8 h-8 opacity-70 flex items-center justify-center text-hasen-dark text-2xl font-bold">
            ?
          </div>
      </div>

      <div v-if="trickNumber" class="relative w-12 h-16 flex items-center justify-center">
        <img :src="trickIcon" alt="Trick" class="w-full h-full object-contain" />
        <div class="absolute inset-0 flex items-center opacity-70 justify-center text-hasen-dark text-2xl font-semibold">
          {{ trickNumber }}
        </div>
      </div>


    
  </div>
</template>
