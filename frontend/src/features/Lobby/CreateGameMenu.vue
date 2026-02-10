<script setup lang="ts">
import { ref } from 'vue';
import ActionButton from '@/common/components/ActionButton.vue';
import { useI18n } from '@/common/composables/useI18n';

const emit = defineEmits<{
  createGame: [gameName: string, playerId: string, maxPlayers: number, pointsToWin: number];
}>();

const { t } = useI18n();
const gameName = ref('My Hasen Game');
const maxPlayers = ref(2);
const pointsToWin = ref(300);

const playerOptions = [2, 3, 4];
const pointsOptions = [50, 150, 200, 250, 300, 350, 400];

const handleCreateGame = () => {
  emit('createGame', gameName.value, 'player_1', maxPlayers.value, pointsToWin.value);
};
</script>

<template>
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

    <div class="form-control">
      <label class="label">
        <span class="label-text text-black font-semibold">Number of Players</span>
      </label>
      <select 
        v-model="maxPlayers"
        class="select select-bordered w-full bg-white text-black"
      >
        <option v-for="option in playerOptions" :key="option" :value="option">
          {{ option }} players
        </option>
      </select>
    </div>

    <div class="form-control">
      <label class="label">
        <span class="label-text text-black font-semibold">Points to Win</span>
      </label>
      <select 
        v-model="pointsToWin"
        class="select select-bordered w-full bg-white text-black"
      >
        <option v-for="option in pointsOptions" :key="option" :value="option">
          {{ option }} points
        </option>
      </select>
    </div>

    <ActionButton 
      :label="t('lobby.createGame')"
      variant="primary"
      @click="handleCreateGame"
    />
  </div>
</template>
