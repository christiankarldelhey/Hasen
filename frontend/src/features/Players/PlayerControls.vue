<script setup lang="ts">
import ActionButton from '@/common/components/ActionButton.vue';
import { useI18n } from '@/common/composables/useI18n';

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

const { t } = useI18n();

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
        :label="t('game.replace')" 
        :disabled="!selectedCardId"
        @click="handleConfirm"
      />
      <ActionButton 
        :label="t('game.skipReplacement')" 
        variant="secondary"
        @click="$emit('skipReplacement')"
      />
    </template>

    <ActionButton 
      v-else-if="mode === 'normal' && isMyTurn && !isTrickInResolve"
      :label="t('game.finishTurn')"
      :disabled="!hasPlayedCard"
      @click="handleFinishTurn"
    />

    <ActionButton 
      v-else-if="isTrickInResolve"
      :label="t('game.finishTrick')"
      :disabled="!canFinishTrick"
      @click="$emit('finishTrick')"
    />
  </div>
</template>
