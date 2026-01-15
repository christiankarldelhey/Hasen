<script setup lang="ts">
import { computed } from 'vue'
import PlayingCard from '@/common/components/PlayingCard.vue'
import { useGameStore } from '@/stores/gameStore'
import cardBack from '@/assets/decks/card-back.png'
import Hare from '@/common/components/Hare.vue'
import OtherPlayerScore from './OtherPlayerScore.vue'
import type { PlayerId } from '@domain/interfaces/Player'

interface Props {
  playerId: PlayerId
  publicCardId: string | null
  handCardsCount: number
  position: 'top' | 'left' | 'right'
}

const props = defineProps<Props>()
const gameStore = useGameStore()

const publicCard = computed(() => {
  if (!props.publicCardId) return null
  const card = gameStore.publicGameState?.publicCards[props.publicCardId]
  // Solo mostrar la carta si está en estado 'in_hand_visible'
  if (card && card.state === 'in_hand_visible') {
    return card
  }
  return null
})

const privateHandsCount = computed(() => {
  // Solo restar 1 si realmente hay una carta visible
  return publicCard.value ? props.handCardsCount - 1 : props.handCardsCount
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

const stackedCardsWidth = computed(() => {
  // 90px base width + (number of cards - 1) * 18px offset
  return privateHandsCount.value > 0 ? 90 + (privateHandsCount.value - 1) * 18 : 0
})
</script>

<template>
  <div 
    :class="['fixed z-10 flex items-center gap-3', positionClasses]"
  >
    <!-- Layout for top position: OtherPlayerScore to the left, then cards -->
    <template v-if="position === 'top'">
      <div class="flex flex-row gap-2 items-center">
        <OtherPlayerScore :player-id="playerId" />
        
        <div class="flex flex-row">
          <!-- Stacked face-down cards -->
          <div 
            class="relative flex justify-center h-[150px]"
            :style="{ width: `${stackedCardsWidth}px` }"
          >
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
        </div>
      </div>
    </template>

    <!-- Layout for left/right positions: OtherPlayerScore on top, then cards below -->
    <template v-else>
      <div class="flex flex-col gap-3 items-center">
        <OtherPlayerScore :player-id="playerId" />
        
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
          
          <!-- Stacked face-down cards for left position -->
          <div v-if="position === 'left'" class="relative flex justify-center h-[150px]">
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
      </div>
    </template>

  </div>
</template>