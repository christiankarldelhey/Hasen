<script setup lang="ts">
import { computed } from 'vue';
import type { PlayingCard as Card } from '@domain/interfaces';
import PlayingCard from '@/common/components/PlayingCard.vue';

// Hardcoded cards for now - will receive from deck in the future
const hardcodedCards: Card[] = [
  {
    id: 'trick-card-1',
    char: 'U',
    suit: 'berries',
    state: 'in_hand_visible',
    rank: { base: 0, onSuit: 40 },
    owner: null,
    points: 0,
    spritePos: { row: 2, col: 5 }
  },
  {
    id: 'trick-card-2',
    char: 'K',
    suit: 'flowers',
    state: 'in_hand_visible',
    rank: { base: 33, onSuit: null },
    owner: null,
    points: 11,
    spritePos: { row: 3, col: 7 }
  },
  {
    id: 'trick-card-3',
    char: 'U',
    suit: 'acorns',
    state: 'in_hand_visible',
    rank: { base: 1, onSuit: null },
    owner: null,
    points: 0,
    spritePos: { row: 0, col: 5 }
  },
//   {
//     id: 'trick-card-4',
//     char: '7',
//     suit: 'leaves',
//     state: 'in_hand_visible',
//     rank: { base: 3, onSuit: 7 },
//     owner: null,
//     points: 0,
//     spritePos: { row: 1, col: 1 }
//   }
];

const cardPositions = computed(() => {
  const totalCards = hardcodedCards.length;
  const cardWidth = 180;
  const cardSpacing = 120; // More spacing between cards
  
  // Random rotations for each card (fixed values for consistency)
  const randomRotations = [-4, 2, -1, 3];
  
  return hardcodedCards.map((card, index) => {
    // Random rotation for each card
    const rotation = randomRotations[index] || 0;
    
    // Calculate horizontal position
    const totalWidth = (totalCards - 1) * cardSpacing;
    const translateX = index * cardSpacing - totalWidth / 2 - cardWidth / 2;
    
    return {
      card,
      rotation,
      translateX,
      zIndex: index
    };
  });
});
</script>

<template>
  <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
    <div class="relative h-[260px] w-[800px]">
      <div
        v-for="pos in cardPositions"
        :key="pos.card.id"
        class="absolute pointer-events-auto"
        :style="{
          transform: `translateX(${pos.translateX}px) rotate(${pos.rotation}deg)`,
          transformOrigin: 'center center',
          zIndex: pos.zIndex,
          left: '50%'
        }"
      >
        <PlayingCard :card="pos.card" />
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
