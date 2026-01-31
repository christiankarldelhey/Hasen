<script setup lang="ts">
import PlayerBidHeader from '@/features/Bids/PlayerBidHeader.vue'
import type { Suit } from '@domain/interfaces/Card'

interface Props {
  type: 'tricks' | 'points' | 'setCollection'
  isActive: boolean
  playerColor: string
  score: number | null
  onLose: number | null
  showLose?: boolean
  winSuit?: Suit | null
  avoidSuit?: Suit | null
  isLastRow?: boolean
}

withDefaults(defineProps<Props>(), {
  showLose: true,
  winSuit: null,
  avoidSuit: null,
  isLastRow: false
})
</script>

<template>
  <div 
    :class="['flex flex-row items-center h-16 rounded-xl shadow-lg w-auto bg-hasen-base', { [`bg-hasen-light border-2 border-[${playerColor}]`]: isActive }]"
  >
    <PlayerBidHeader 
      :type="type" 
      :isActive="isActive" 
      :playerColor="playerColor"
      :score="score"
      :onLose="onLose"
      :showLose="showLose"
      :winSuit="winSuit"
      :avoidSuit="avoidSuit"
    />
    <div class="flex flex-row items-center gap-1 px-4 py-2 flex-1">
      <slot />
    </div>
  </div>
</template>
