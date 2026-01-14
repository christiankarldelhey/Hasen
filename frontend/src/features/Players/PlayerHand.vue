<script setup lang="ts">
import { computed, ref } from 'vue';
import type { PlayingCard as Card } from '@domain/interfaces';
import PlayingCard from '@/common/components/PlayingCard.vue';

interface Props {
  cards: Card[];
  mode?: 'normal' | 'card_replacement';
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'normal'
});

const emit = defineEmits<{
  skipReplacement: []
  confirmReplacement: [cardId: string, position: number]
}>();

const selectedCardId = ref<string | null>(null);

const isCardSelectable = (card: Card) => {
  return props.mode === 'card_replacement' && card.state === 'in_hand_hidden'
};

const selectCard = (card: Card) => {
  if (isCardSelectable(card)) {
    selectedCardId.value = card.id
  }
};

const handleSkip = () => {
  emit('skipReplacement')
};

const handleConfirm = () => {
  if (selectedCardId.value) {
    const position = props.cards.findIndex(card => card.id === selectedCardId.value)
    emit('confirmReplacement', selectedCardId.value, position)
    selectedCardId.value = null
  }
};

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
          @click="selectCard(pos.card)"
        >
          <div :class="[
            'relative',
            selectedCardId === pos.card.id ? 'ring-4 ring-yellow-400 rounded-lg' : '',
            pos.card.state === 'in_hand_visible' && mode === 'card_replacement' ? 'opacity-50' : ''
          ]">
            <PlayingCard 
              :card="pos.card" 
              :class="[
                'transition-transform duration-200 ease-out',
                isCardSelectable(pos.card) ? 'cursor-pointer hover:-translate-y-[60px] hover:scale-105 hover:!z-[1000]' : 'cursor-pointer hover:-translate-y-[60px] hover:scale-105 hover:!z-[1000]'
              ]"
            />
          </div>
        </div>
      </TransitionGroup>
    </div>
    
    <!-- Botones para card replacement -->
    <div v-if="mode === 'card_replacement'" class="absolute right-8 bottom-32 flex flex-col gap-3 pointer-events-auto z-[2000]">
      <button
        @click="handleConfirm"
        :disabled="!selectedCardId"
        class="px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
      >
        Confirm
      </button>
      <button
        @click="handleSkip"
        class="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg shadow-lg hover:bg-gray-700 transition-colors"
      >
        Skip
      </button>
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