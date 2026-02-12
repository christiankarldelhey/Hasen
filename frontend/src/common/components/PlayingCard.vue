<script setup lang="ts">
import type { PlayingCard } from '@domain/interfaces'
import { computed } from 'vue'
import deckSprite from '@/assets/sprites/deck-sprite_v3.jpg'

interface Props {
  card: PlayingCard
  size?: 'small' | 'medium' | 'large'
  selectable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'large',
  selectable: false
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'small':
      return 'w-[85px] h-[150px]'
    case 'medium':
      return 'w-[127px] h-[225px]'
    case 'large':
    default:
      return 'w-[158px] h-[280px]'
  }
})

const backgroundPosition = computed(() => {
  const { row, col } = props.card.spritePos
  // Use 9 columns (0-8) for positioning
  const x = (col / 8) * 100
  const y = (row / 3) * 100
  return `${x}% ${y}%`
})
</script>

<template>
  <div 
    :class="['rounded-lg drop-shadow-2xl', sizeClasses]"
    :style="{
      backgroundImage: `url(${deckSprite})`,
      backgroundSize: '900% 400%',
      backgroundPosition: backgroundPosition,
      border: selectable ? '3px solid #facc15' : 'none'
    }"
  />
</template>