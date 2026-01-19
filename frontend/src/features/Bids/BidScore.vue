<script setup lang="ts">
import { computed } from 'vue'
import type { PlayerId } from '@domain/interfaces/Player'
import { AVAILABLE_PLAYERS } from '@domain/interfaces/Player'

const props = defineProps<{
  score: number
  bidders: PlayerId[]
}>()

const backgroundStyle = computed(() => {
  if (props.bidders.length === 0) {
    return { backgroundColor: '#e2d2a8' }
  }
  
  if (props.bidders.length === 1) {
    const player = AVAILABLE_PLAYERS.find(p => p.id === props.bidders[0])
    return { backgroundColor: player?.color || '#e2d2a8' }
  }
  
  if (props.bidders.length === 2) {
    const player1 = AVAILABLE_PLAYERS.find(p => p.id === props.bidders[0])
    const player2 = AVAILABLE_PLAYERS.find(p => p.id === props.bidders[1])
    return {
      background: `linear-gradient(135deg, ${player1?.color || '#e2d2a8'} 50%, ${player2?.color || '#e2d2a8'} 50%)`
    }
  }
  
  return { backgroundColor: '#e2d2a8' }
})
</script>

<template>
  <div class="w-[20%] min-w-0 flex items-center justify-center avatar avatar-placeholder">
    <div 
      class="w-10 h-10 rounded-full border-1 border-hasen-dark flex items-center justify-center
        transition-all duration-200
        group-hover:border-2 group-hover:shadow-md"
      :style="backgroundStyle">
      <span class="text-xl font-semibold text-hasen-dark">{{ score }}</span>
    </div>
  </div>
</template>