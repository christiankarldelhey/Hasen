<script setup lang="ts">
import { computed, inject } from 'vue';
import type { PlayingCard as Card, TrickState } from '@domain/interfaces';
import PlayingCard from '@/common/components/PlayingCard.vue';

const props = defineProps<{
  cards: Card[];
  winningCardId?: string | null;
  trickState?: TrickState | null;
}>();

// Inyectar métodos de special cards
const specialCards = inject<any>('specialCards', null)

const isCardSelectable = (cardId: string) => 
  specialCards?.isCardSelectable(cardId) ?? false

const handleCardClick = (cardId: string) => {
  if (isCardSelectable(cardId) && specialCards) {
    specialCards.handleCardClick(cardId)
  }
}

// Computed para cachear resultados de isCardSelectable y evitar llamadas repetidas
const cardSelectableMap = computed(() => {
  const map: Record<string, boolean> = {}
  props.cards.forEach(card => {
    map[card.id] = isCardSelectable(card.id)
  })
  return map
})

const getCardClasses = (cardId: string) => ({
  'cursor-pointer': cardSelectableMap.value[cardId],
  'hover:scale-110': cardSelectableMap.value[cardId],
  'transition-all duration-300': true,
  'selectable-glow': cardSelectableMap.value[cardId]
})

const cardPositions = computed(() => {
  const totalCards = props.cards.length;
  const cardWidth = 180;
  const cardSpacing = 150; // Spacing to keep top-right corner visible
  
  // Random rotations for each card (fixed values for consistency)
  const randomRotations = [-4, 2, -1, 3];
  
  return props.cards.map((card, index) => {
    // Random rotation for each card
    const rotation = randomRotations[index] || 0;
    
    // Calculate horizontal position
    const totalWidth = (totalCards - 1) * cardSpacing;
    const translateX = index * cardSpacing - totalWidth / 2 - cardWidth / 2;
    
    // Elevar la carta ganadora solo cuando el trick está en estado 'resolve'
    const isWinning = props.trickState === 'resolve' && props.winningCardId && card.id === props.winningCardId;
    const translateY = isWinning ? -30 : 0;
    
    return {
      card,
      rotation,
      translateX,
      translateY,
      zIndex: isWinning ? 100 : index,
      isWinning
    };
  });
});
</script>

<template>
  <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
    <div class="relative h-[260px] w-[800px]">
      <template v-if="props.cards.length > 0">
        <div
          v-for="pos in cardPositions"
          :key="pos.card.id"
          class="absolute pointer-events-auto transition-all duration-500 ease-out"
          :style="{
            transform: `translateX(${pos.translateX}px) translateY(${pos.translateY}px) rotate(${pos.rotation}deg)`,
            transformOrigin: 'center center',
            zIndex: pos.zIndex,
            left: '50%'
          }"
          @click="handleCardClick(pos.card.id)"
        >
          <div :class="[
            'relative',
            pos.isWinning ? 'ring-4 ring-yellow-400 rounded-lg shadow-2xl' : '',
            getCardClasses(pos.card.id)
          ]">
            <PlayingCard :card="pos.card" />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
@keyframes selectableGlow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(59, 130, 246, 0.6);
  }
}

.selectable-glow {
  animation: selectableGlow 2s ease-in-out infinite;
  filter: brightness(1.2);
}
</style>
