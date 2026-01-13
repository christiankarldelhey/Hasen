<script setup lang="ts">
import { computed } from 'vue'
import PlayingCard from '@/common/components/PlayingCard.vue'
import { useGameStore } from '@/stores/gameStore'
import cardBack from '@/assets/decks/card-back.png'
import Hare from '@/common/components/Hare.vue'

interface Props {
  playerId: string
  publicCardId: string
  handCardsCount: number
  position: 'top' | 'left' | 'right'
}

const props = defineProps<Props>()
const gameStore = useGameStore()

const privateHandsCount = computed(() => {
  return props.publicCardId ? props.handCardsCount - 1 : props.handCardsCount
})

const publicCard = computed(() => {
  return gameStore.publicGameState?.publicCards[props.publicCardId] || null
})

const positionClasses = computed(() => {
  switch (props.position) {
    case 'top':
      return 'top-4 left-1/2 -translate-x-1/2'
    case 'left':
      return 'left-4 top-1/2 -translate-y-1/2'
    case 'right':
      return 'right-4 top-1/2 -translate-y-1/2'
  }
})

const stackedCards = computed(() => {
  return Array.from({ length: privateHandsCount.value }, (_, index) => index)
})
</script>

<template>
  <div 
    :class="['fixed z-10 flex flex-col items-center gap-3', positionClasses]"
  >
    <div class="text-white text-sm font-semibold bg-black/50 px-3 py-1 rounded-full">
      <Hare :player-id="playerId" />
    </div>
    <div class="flex flex-row">
      <!-- Stacked face-down cards -->
      <div v-if="position === 'right'" class="relative flex justify-center h-[150px]">
        <div 
          v-for="(card, index) in stackedCards" 
          :key="index"
          class="absolute rounded-lg w-[90px] h-[150px]"
          :style="{
            backgroundImage: `url(${cardBack})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `translate(${index * 18}px, 0px)`,
            zIndex: privateHandsCount - index
          }"
        />
      </div>
      
      <div v-if="publicCard" class="flex justify-center z-10">
        <PlayingCard :card="publicCard" size="small" />
      </div>
      
      <!-- Stacked face-down cards for other positions -->
      <div v-if="position !== 'right'" class="relative flex justify-center h-[150px]">
        <div 
          v-for="(card, index) in stackedCards" 
          :key="index"
          class="absolute rounded-lg w-[90px] h-[150px]"
          :style="{
            backgroundImage: `url(${cardBack})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `translate(${index * 18}px, 0px)`,
            zIndex: privateHandsCount - index
          }"
        />
      </div>
    </div>
    

    
    <!-- Public card if exists -->

  </div>
</template>