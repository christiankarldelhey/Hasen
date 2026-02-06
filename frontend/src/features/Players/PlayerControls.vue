<script setup lang="ts">
import ActionButton from '@/common/components/ActionButton.vue';

interface Props {
  mode?: 'normal' | 'card_replacement';
  isMyTurn?: boolean;
  isTrickInResolve?: boolean;
  canFinishTrick?: boolean;
  selectedCardId?: string | null;
  hasPlayedCard?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'normal',
  isMyTurn: false,
  isTrickInResolve: false,
  canFinishTrick: true,
  selectedCardId: null,
  hasPlayedCard: false
});

const emit = defineEmits<{
  skipReplacement: []
  confirm: []
  finishTurn: []
  finishTrick: []
}>();

const handleConfirm = () => {
  emit('confirm');
};

const handleFinishTurn = () => {
  emit('finishTurn');
};
</script>

<template>
  <div class="flex flex-col gap-3 pointer-events-auto">
    <template v-if="mode === 'card_replacement'">
      <ActionButton 
        label="Replace" 
        :disabled="!selectedCardId"
        @click="handleConfirm"
      />
      <ActionButton 
        label="Skip (+3 points)" 
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
      :disabled="!canFinishTrick"
      @click="$emit('finishTrick')"
    />
  </div>
</template>
