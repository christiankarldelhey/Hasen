<script setup lang="ts">
import ActionButton from '@/common/components/ActionButton.vue';
import { useI18n } from '@/common/composables/useI18n';

const emit = defineEmits<{
  createGame: [];
  joinGame: [];
  rules: [];
  settings: [];
}>();

const { t } = useI18n();
</script>

<template>
  <div class="flex flex-col gap-5">
    <ActionButton 
      :label="t('lobby.createNewGame')"
      variant="primary"
      @click="emit('createGame')"
    />
    
    <ActionButton 
      :label="t('lobby.joinGame')"
      variant="primary"
      @click="emit('joinGame')"
    />
    
    <ActionButton 
      :label="t('lobby.rules')"
      variant="primary"
      @click="emit('rules')"
    />
    
    <ActionButton 
      :label="t('lobby.settings')"
      variant="primary"
      @click="emit('settings')"
    />
  </div>
</template>