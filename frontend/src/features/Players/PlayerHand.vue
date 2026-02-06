<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import type { PlayingCard as Card } from '@domain/interfaces';
import { useHasenStore } from '@/stores/hasenStore';
import { useGameStore } from '@/stores/gameStore';
import { useAnimationCoords } from '@/features/Animations';
import PlayerBids from '../Bids/PlayerBids.vue';
import PlayerInfo from '@/common/components/PlayerInfo.vue';
import PlayerCards from './PlayerCards.vue';
import PlayerNotifications from './PlayerNotifications.vue';
import PlayerControls from './PlayerControls.vue';

interface Props {
  cards: Card[];
  mode?: 'normal' | 'card_replacement';
  isMyTurn?: boolean;
  isTrickInResolve?: boolean;
  canFinishTrick?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'normal',
  isMyTurn: false,
  isTrickInResolve: false,
  canFinishTrick: true
});

const emit = defineEmits<{
  skipReplacement: []
  confirmReplacement: [cardId: string, position: number]
  playCard: [cardId: string]
  finishTurn: []
  finishTrick: []
}>();

const hasenStore = useHasenStore();
const gameStore = useGameStore();
const selectedCardId = ref<string | null>(null);

const playerHandEl = ref<HTMLElement | null>(null);
const coords = useAnimationCoords();
onMounted(() => coords.register('player-hand', playerHandEl));
onUnmounted(() => coords.unregister('player-hand'));
const hasPlayedCard = ref<boolean>(false);

// Reset hasPlayedCard when it becomes my turn
watch(() => props.isMyTurn, (newVal) => {
  if (newVal) {
    hasPlayedCard.value = false;
  }
});

// Also reset hasPlayedCard when trick number changes (new trick started)
watch(() => gameStore.publicGameState?.round.currentTrick?.trick_number, () => {
  hasPlayedCard.value = false;
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
  <div ref="playerHandEl" class="fixed bottom-0 left-0 right-0 pointer-events-none h-[300px]">
    <div class="absolute left-0 right-0 top-0 bottom-0 flex justify-center items-end">
      <PlayerCards 
        :cards="cards"
        :mode="mode"
        :selected-card-id="selectedCardId"
        @select-card="selectCard"
      />
    </div>
    
    <div class="relative h-full flex justify-between items-end px-4 pb-4">
      <PlayerBids />
      
      <div class="flex flex-col gap-3 pointer-events-auto">
        <PlayerInfo 
          v-if="hasenStore.currentPlayerId" 
          :player-id="hasenStore.currentPlayerId" 
          :is-player="true" />
        <PlayerNotifications />
        <PlayerControls 
          :mode="mode"
          :is-my-turn="isMyTurn"
          :is-trick-in-resolve="isTrickInResolve"
          :can-finish-trick="canFinishTrick"
          :selected-card-id="selectedCardId"
          :has-played-card="hasPlayedCard"
          @skip-replacement="$emit('skipReplacement')"
          @confirm="handleConfirm"
          @finish-turn="handleFinishTurn"
          @finish-trick="$emit('finishTrick')"
        />
      </div>
    </div>
  </div>
</template>