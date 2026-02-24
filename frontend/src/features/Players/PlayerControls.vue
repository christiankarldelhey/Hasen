<script setup lang="ts">
import ActionButton from '@/common/components/ActionButton.vue';
import { useI18n } from '@/common/composables/useI18n';

interface Props {
  mode?: 'normal' | 'card_replacement';
  isTrickInResolve?: boolean;
  canFinishTrick?: boolean;
  selectedCardId?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'normal',
  isTrickInResolve: false,
  canFinishTrick: true,
  selectedCardId: null
});

const emit = defineEmits<{
  skipReplacement: []
  confirm: []
  finishTrick: []
}>();

const { t } = useI18n();

const handleConfirm = () => {
  emit('confirm');
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
      v-if="isTrickInResolve"
      :label="t('game.finishTrick')"
      :disabled="!canFinishTrick"
      @click="$emit('finishTrick')"
    />
  </div>
</template>
