<script setup lang="ts">
import { ref, watch } from 'vue';
import type { PlayingCard as Card } from '@domain/interfaces';
import PlayerScore from './PlayerScore.vue';
import PlayerCards from './PlayerCards.vue';

interface Props {
  cards: Card[];
  mode?: 'normal' | 'card_replacement';
  isMyTurn?: boolean;
  isTrickInResolve?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'normal',
  isMyTurn: false,
  isTrickInResolve: false
});

const emit = defineEmits<{
  skipReplacement: []
  confirmReplacement: [cardId: string, position: number]
  playCard: [cardId: string]
  finishTurn: []
}>();

const selectedCardId = ref<string | null>(null);
const hasPlayedCard = ref<boolean>(false);

watch(() => props.isMyTurn, (newVal) => {
  if (newVal) {
    hasPlayedCard.value = false;
  }
});

const isCardSelectable = (card: Card) => {
  return props.mode === 'card_replacement' && card.state === 'in_hand_hidden'
};

const selectCard = (card: Card) => {
  // Modo card_replacement: seleccionar carta para reemplazo
  if (props.mode === 'card_replacement' && isCardSelectable(card)) {
    selectedCardId.value = card.id
  }
  // Modo normal: jugar carta directamente
  else if (props.mode === 'normal' && !hasPlayedCard.value) {
    emit('playCard', card.id)
    hasPlayedCard.value = true
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

const handleFinishTurn = () => {
  emit('finishTurn')
  hasPlayedCard.value = false
};
</script>

<template>
  <div class="fixed bottom-0 left-0 right-0 flex justify-center items-end pointer-events-none h-[300px]">
    <!-- PlayerScore a la izquierda -->
    <div class="absolute left-4 bottom-8 pointer-events-auto">
      <PlayerScore />
    </div>
    
    <!-- PlayerCards con su propio transform -->
    <PlayerCards 
      :cards="cards" 
      :mode="mode"
      :selected-card-id="selectedCardId"
      @select-card="selectCard"
    />
    
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
    
    <!-- Botón para finish turn -->
    <div v-if="mode === 'normal' && isMyTurn && !isTrickInResolve" class="absolute right-8 bottom-32 flex flex-col gap-3 pointer-events-auto z-[2000]">
      <button
        @click="handleFinishTurn"
        :disabled="!hasPlayedCard"
        class="px-6 py-3 bg-hasen-green text-white font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
      >
        Finish Turn
      </button>
    </div>
  </div>
</template>