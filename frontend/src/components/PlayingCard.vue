<script setup lang="ts">
import type { PlayingCard } from '@domain/interfaces'
import { computed } from 'vue'
import deckSprite from '@/assets/sprites/deck-sprite.jpg'

interface Props {
  card: PlayingCard
}

const props = defineProps<Props>()

const backgroundPosition = computed(() => {
  const { row, col } = props.card.spritePos
  const x = (col / 7) * 100
  const y = (row / 3) * 100
  return `${x}% ${y}%`
})
</script>

<template>
  <div 
    class="w-[120px] h-[200px]"
    :style="{
      backgroundImage: `url(${deckSprite})`,
      backgroundSize: '800% 400%',
      backgroundPosition: backgroundPosition
    }"
  />
</template>