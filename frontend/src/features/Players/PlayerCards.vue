<script setup lang="ts">
import { computed } from 'vue';
import type { PlayingCard as Card } from '@domain/interfaces';
import PlayingCard from '@/common/components/PlayingCard.vue';
import { useGameStore } from '@/stores/gameStore';
import { useHasenStore } from '@/stores/hasenStore';

interface Props {
  cards: Card[];
  mode?: 'normal' | 'card_replacement';
  selectedCardId: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'normal'
});

const emit = defineEmits<{
  selectCard: [card: Card]
}>();

const gameStore = useGameStore();
const hasenStore = useHasenStore();

const isCardSelectable = (card: Card) => {
  return props.mode === 'card_replacement' && card.state === 'in_hand_hidden'
};

const isCardDisabled = (card: Card) => {
  // Deshabilitar carta pública en modo reemplazo
  if (props.mode === 'card_replacement' && card.state === 'in_hand_visible') {
    return true;
  }
  
  // Deshabilitar acorns-S en primer turno del primer trick si el jugador es lead player
  const currentTrick = gameStore.publicGameState?.round.currentTrick;
  if (!currentTrick) return false;
  
  const isAcornsS = card.suit === 'acorns' && card.char === 'S';
  const isFirstCardOfTrick = currentTrick.cards.length === 0;
  const isFirstTrick = currentTrick.trick_number === 1;
  const isLeadPlayer = currentTrick.lead_player === hasenStore.currentPlayerId;
  
  if (isAcornsS && isFirstCardOfTrick && isFirstTrick && isLeadPlayer) {
    return true;
  }
  
  return false;
};

const selectCard = (card: Card) => {
  // No permitir seleccionar cartas deshabilitadas
  if (isCardDisabled(card)) {
    return;
  }
  emit('selectCard', card);
};

const cardPositions = computed(() => {
  const totalCards = props.cards.length;
  if (totalCards === 0) return [];
  
  const cardWidth = 180;
  const maxRotation = Math.min(45, totalCards * 4);
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
  <div class="relative h-[260px]" style="transform: translateY(40%);">
    <TransitionGroup name="card">
      <div
        v-for="(pos, _index) in cardPositions"
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
          isCardDisabled(pos.card) ? 'opacity-50' : ''
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
