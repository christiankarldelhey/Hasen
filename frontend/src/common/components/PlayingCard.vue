<script setup lang="ts">
import type { PlayingCard } from '@domain/interfaces'
import { computed } from 'vue'
import deckSprite from '@/assets/sprites/deck-sprite.jpg'

interface Props {
  card: PlayingCard
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'large'
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'small':
      return 'w-[90px] h-[150px]'
    case 'medium':
      return 'w-[135px] h-[225px]'
    case 'large':
    default:
      return 'w-[180px] h-[300px]'
  }
})

const backgroundPosition = computed(() => {
  const { row, col } = props.card.spritePos
  const x = (col / 7) * 100
  const y = (row / 3) * 100
  return `${x}% ${y}%`
})
</script>

<template>
  <div 
    :class="['rounded-lg drop-shadow-2xl', sizeClasses]"
    :style="{
      backgroundImage: `url(${deckSprite})`,
      backgroundSize: '800% 400%',
      backgroundPosition: backgroundPosition
    }"
  />
</template>