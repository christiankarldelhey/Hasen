<script setup lang="ts">
import { computed } from 'vue'
import PlayingCard from '@/common/components/PlayingCard.vue'
import { useGameStore } from '@/stores/gameStore'

interface Props {
  playerId: string
  publicCardId: string
  handCardsCount: number
  position: 'top' | 'left' | 'right'
}

const props = defineProps<Props>()
const gameStore = useGameStore()

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
</script>

<template>
  <div 
    :class="['fixed z-10 flex flex-col items-center gap-2', positionClasses]"
  >
    <div class="text-white text-sm font-semibold bg-black/50 px-3 py-1 rounded-full">
      {{ playerId }} ({{ handCardsCount }})
    </div>
    <PlayingCard v-if="publicCard" :card="publicCard" size="small" />
  </div>
</template>