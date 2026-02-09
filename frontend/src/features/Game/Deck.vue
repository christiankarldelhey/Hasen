<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import cardBack from '@/assets/decks/card-back.png'
import { useAnimationCoords } from '@/features/Animations'

const deckLayers = 5
const deckEl = ref<HTMLElement | null>(null)

const coords = useAnimationCoords()
onMounted(() => coords.register('deck', deckEl))
onUnmounted(() => coords.unregister('deck'))
</script>

<template>
  <div ref="deckEl" class="z-10 relative" style="width: 93px; height: 150px;">
    <div 
      v-for="index in deckLayers" 
      :key="index"
      class="absolute rounded-lg w-[85px] h-[150px]"
      :style="{
        backgroundImage: `url(${cardBack})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transform: `translate(${(index - 1) * -1}px, ${(index - 1) * 2}px)`,
        zIndex: deckLayers - index
      }"
    />
  </div>
</template>
