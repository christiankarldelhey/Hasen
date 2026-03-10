<script setup lang="ts">
import ActionButton from '@/common/components/ActionButton.vue';
import { useI18n } from '@/common/composables/useI18n';

const emit = defineEmits<{
  createGame: [];
  joinGame: [];
  tutorial: [];
  rules: [];
  settings: [];
}>();

const { t } = useI18n();
</script>

<template>
  <div class="flex flex-col gap-5" data-testid="lobby-options">
    <div data-testid="lobby-create-game-btn" @click="emit('createGame')">
      <ActionButton 
        :label="t('lobby.createNewGame')"
        variant="primary"
      />
    </div>
    
    <div data-testid="lobby-join-game-btn" @click="emit('joinGame')">
      <ActionButton 
        :label="t('lobby.joinGame')"
        variant="primary"
      />
    </div>

    <div data-testid="lobby-tutorial-btn" @click="emit('tutorial')">
      <ActionButton
        :label="t('lobby.tutorial')"
        variant="primary"
      />
    </div>
    
    <div data-testid="lobby-rules-btn" @click="emit('rules')">
      <ActionButton 
        :label="t('lobby.rules')"
        variant="primary"
      />
    </div>
    
    <div data-testid="lobby-settings-btn" @click="emit('settings')">
      <ActionButton 
        :label="t('lobby.settings')"
        variant="primary"
      />
    </div>
  </div>
</template>