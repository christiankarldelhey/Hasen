<script setup lang="ts">
import { ref, watch } from 'vue';
import type { PlayingCard as Card } from '@domain/interfaces';
import PlayerScore from './PlayerScore.vue';
import PlayerCards from './PlayerCards.vue';
import PlayerGameInfo from './PlayerGameInfo.vue';
import ActionButton from '@/common/components/ActionButton.vue';

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
  finishTrick: []
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
  if (props.mode === 'card_replacement' && isCardSelectable(card)) {
    selectedCardId.value = card.id
  } else if (props.mode === 'normal' && !hasPlayedCard.value) {
    emit('playCard', card.id)
    hasPlayedCard.value = true
  }
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
  <div class="fixed bottom-0 left-0 right-0 flex justify-between items-end px-4 pb-4 pointer-events-none h-[300px]">
    <div class="pointer-events-auto">
      <PlayerScore />
    </div>
    
    <PlayerCards 
      :cards="cards"
      :mode="mode"
      :selected-card-id="selectedCardId"
      @select-card="selectCard"
    />
    
    <div class="flex flex-col gap-3 pointer-events-auto">
      <PlayerGameInfo />
      
      <template v-if="mode === 'card_replacement'">
        <ActionButton 
          label="Confirm" 
          :disabled="!selectedCardId"
          @click="handleConfirm"
        />
        <ActionButton 
          label="Skip" 
          variant="secondary"
          @click="$emit('skipReplacement')"
        />
      </template>

      <ActionButton 
        v-else-if="mode === 'normal' && isMyTurn && !isTrickInResolve"
        label="Finish Turn"
        :disabled="!hasPlayedCard"
        @click="handleFinishTurn"
      />

      <ActionButton 
        v-else-if="isTrickInResolve"
        label="Finish Trick"
        @click="$emit('finishTrick')"
      />
    </div>
  </div>
</template>