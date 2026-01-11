<script setup lang="ts">
import deckImage from '@/assets/symbols/deck.png'
</script>

<template>
  <div class="fixed top-4 left-4 z-10">
    <img 
      :src="deckImage" 
      alt="Deck" 
      class="w-[122px] h-[122px] object-contain"
    />
  </div>
</template>
