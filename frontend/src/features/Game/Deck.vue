<script setup lang="ts">
import cardBack from '@/assets/decks/card-back.png'

const deckLayers = 5
</script>

<template>
  <div class="z-10 relative" style="width: 98px; height: 150px;">
    <div 
      v-for="index in deckLayers" 
      :key="index"
      class="absolute rounded-lg w-[90px] h-[150px]"
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
