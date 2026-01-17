<script setup lang="ts">
import { ref } from 'vue';
import ActionButton from '@/common/components/ActionButton.vue';

const emit = defineEmits<{
  createGame: [gameName: string, playerId: string];
  back: [];
}>();

const gameName = ref('My Hasen Game');

const handleCreateGame = () => {
  emit('createGame', gameName.value, 'player_1');
};
</script>

<template>
  <div class="flex flex-col gap-4">
    <ActionButton 
      label="← Back to menu" 
      variant="primary"
      @click="emit('back')"
    />

    <div class="flex flex-col gap-4">
      <div class="form-control">
        <label class="label">
          <span class="label-text text-black font-semibold">Game Name</span>
        </label>
        <input 
          v-model="gameName"
          type="text"
          placeholder="Enter game name"
          class="input input-bordered w-full bg-white text-black"
          required
        />
      </div>

      <ActionButton 
        label="Create Game"
        variant="tertiary"
        @click="handleCreateGame"
      />
    </div>
  </div>
</template>