<script setup lang="ts">
import deckImage from '@/assets/decks/deck-2.png'
</script>

<template>
  <div class="z-10">
    <img 
      :src="deckImage" 
      alt="Deck" 
      class="h-[160px] object-contain"
    />
  </div>
</template>
