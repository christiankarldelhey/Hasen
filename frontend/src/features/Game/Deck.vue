<script setup lang="ts">
import deckImage from '@/assets/decks/deck-2.png'
</script>

<template>
  <div class="fixed top-4 left-4 z-10">
    <img 
      :src="deckImage" 
      alt="Deck" 
      class="h-[182px] object-contain"
    />
  </div>
</template>
