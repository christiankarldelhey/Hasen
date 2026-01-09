<script setup lang="ts">
import { computed } from 'vue';
import type { PlayingCard as Card } from '@domain/interfaces';
import PlayingCard from '@/common/components/PlayingCard.vue';

interface Props {
  cards: Card[];
}

const props = defineProps<Props>();

const cardPositions = computed(() => {
  const totalCards = props.cards.length;
  if (totalCards === 0) return [];
  
  const cardWidth = 180; // Ancho de PlayingCard
  const maxRotation = Math.min(30, totalCards * 3);
  const cardSpacing = Math.min(80, 400 / totalCards);
  
  return props.cards.map((card, index) => {
    const rotation = totalCards === 1 
      ? 0 
      : (index / (totalCards - 1) - 0.5) * maxRotation;
    
    const totalWidth = (totalCards - 1) * cardSpacing;
    const translateX = index * cardSpacing - totalWidth / 2 - cardWidth / 2;
    
    const normalizedPos = totalCards === 1 ? 0 : index / (totalCards - 1) - 0.5;
    const translateY = Math.abs(normalizedPos) * 20;
    
    return {
      card,
      rotation,
      translateX,
      translateY,
      zIndex: index
    };
  });
});
</script>

<template>
  <div class="fixed bottom-0 left-0 right-0 flex justify-center items-end pointer-events-none h-[300px]" 
       style="transform: translateY(20%);">
    <div class="relative h-[260px]">
      <TransitionGroup name="card">
        <div
          v-for="(pos, index) in cardPositions"
          :key="pos.card.id"
          class="absolute pointer-events-auto transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          :style="{
            transform: `translateX(${pos.translateX}px) translateY(${pos.translateY}px) rotate(${pos.rotation}deg)`,
            transformOrigin: 'center bottom',
            zIndex: pos.zIndex
          }"
        >
          <PlayingCard 
            :card="pos.card" 
            class="cursor-pointer transition-transform duration-200 ease-out hover:-translate-y-[60px] hover:scale-105 hover:!z-[1000]" 
          />
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.card-enter-active,
.card-leave-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.card-enter-from {
  opacity: 0;
  transform: translateY(100px) scale(0.8);
}

.card-leave-to {
  opacity: 0;
  transform: translateY(-100px) scale(0.8);
}

.card-move {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>