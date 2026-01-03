<script setup lang="ts">
import { ref } from 'vue';

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
    <button @click="emit('back')" class="btn bg-gray-500 text-white w-full">
      ← Back to menu
    </button>

    <form @submit.prevent="handleCreateGame" class="flex flex-col gap-4">
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

      <button 
        type="submit"
        class="btn bg-hasen-dark text-white w-full"
      >
        Create Game
      </button>
    </form>
  </div>
</template>