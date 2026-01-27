<script setup lang="ts">
import { computed } from 'vue'
import type { PlayerId } from '@domain/interfaces/Player'
import { useGameStore } from '@/stores/gameStore'
import CarrotIcon from '@/assets/symbols/carrot.svg'

interface Props {
  playerId: PlayerId
  size?: 'small' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'small'
})

const gameStore = useGameStore()

const playerScore = computed(() => {
  const roundScore = gameStore.publicGameState?.round.roundScore || []
  const found = roundScore.find((score) => score.playerId === props.playerId)
  return found?.points ?? 0
})

const iconSize = computed(() => props.size === 'small' ? 'h-5 w-5' : 'h-7 w-7')
const textSize = computed(() => props.size === 'small' ? 'text-xxl' : 'text-lg')
</script>

<template>
  <div class="flex items-center gap-1">
    <img :src="CarrotIcon" alt="carrot" :class="[iconSize, 'brightness-0 invert']" />
    <span :class="['text-white font-semibold', textSize]">{{ playerScore }}</span>
  </div>
</template>
