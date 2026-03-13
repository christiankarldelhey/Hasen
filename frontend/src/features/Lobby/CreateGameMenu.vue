<script setup lang="ts">
import { computed, ref } from 'vue';
import ActionButton from '@/common/components/ActionButton.vue';
import { useI18n } from '@/common/composables/useI18n';

const emit = defineEmits<{
  createGame: [gameName: string, playerId: string, maxPlayers: number, pointsToWin: number, botCount: number];
}>();

const { t } = useI18n();
const gameName = ref('My Hasen Game');
const pointsToWin = ref(300);
const selectedMode = ref('humans_2');

const pointsOptions = [50, 150, 200, 250, 300, 350, 400];
const modeOptions = [
  { id: 'humans_2', maxPlayers: 2, botCount: 0 },
  { id: 'humans_3', maxPlayers: 3, botCount: 0 },
  { id: 'humans_4', maxPlayers: 4, botCount: 0 },
  { id: 'one_plus_1bot', maxPlayers: 2, botCount: 1 },
  { id: 'one_plus_2bots', maxPlayers: 3, botCount: 2 },
  { id: 'one_plus_3bots', maxPlayers: 4, botCount: 3 }
];

const selectedConfig = computed(() => {
  return modeOptions.find(option => option.id === selectedMode.value) ?? modeOptions[0];
});

const formatModeLabel = (maxPlayers: number, botCount: number) => {
  if (botCount === 0) {
    return t('lobby.playersOption', { count: maxPlayers });
  }
  return t('lobby.onePlayerPlusBotsOption', { count: botCount });
};

const handleCreateGame = () => {
  const config = selectedConfig.value;
  if (!config) return;
  emit('createGame', gameName.value, 'player_1', config.maxPlayers, pointsToWin.value, config.botCount);
};
</script>

<template>
  <div class="flex flex-col gap-4" data-testid="create-game-menu">
    <div class="form-control">
      <label class="label">
        <span class="label-text text-black font-semibold">{{ t('lobby.gameName') }}</span>
      </label>
      <input 
        data-testid="create-game-name-input"
        v-model="gameName"
        type="text"
        :placeholder="t('lobby.gameNamePlaceholder')"
        class="input input-bordered w-full bg-white text-black"
        required
      />
    </div>

    <div class="form-control">
      <label class="label">
        <span class="label-text text-black font-semibold">{{ t('lobby.players') }}</span>
      </label>
      <select 
        data-testid="create-game-max-players-select"
        v-model="selectedMode"
        class="select select-bordered w-full bg-white text-black"
      >
        <option v-for="option in modeOptions" :key="option.id" :value="option.id">
          {{ formatModeLabel(option.maxPlayers, option.botCount) }}
        </option>
      </select>
    </div>

    <div class="form-control">
      <label class="label">
        <span class="label-text text-black font-semibold">{{ t('lobby.pointsToWin') }}</span>
      </label>
      <select 
        data-testid="create-game-points-to-win-select"
        v-model="pointsToWin"
        class="select select-bordered w-full bg-white text-black"
      >
        <option v-for="option in pointsOptions" :key="option" :value="option">
          {{ t('lobby.pointsToWinLabel', { points: option }) }}
        </option>
      </select>
    </div>

    <ActionButton 
      data-testid="create-game-submit-btn"
      :label="t('lobby.createGame')"
      variant="primary"
      @click="handleCreateGame"
    />
  </div>
</template>
