<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref, watch } from 'vue';
import { useSocketLobby } from '../../common/composables/useSocketLobby';
import { useLobbyStore } from '../../stores/lobbyStore';
import { userIdService } from '../../services/userIdService';
import type { LobbyGame } from '@domain/interfaces/Game';
import type { PlayerId } from '@domain/interfaces/Player';
import { getAvailablePlayerColors } from '@domain/interfaces/Player';
import ActionButton from '@/common/components/ActionButton.vue';
import { useI18n } from '@/common/composables/useI18n';
import { useGameAPI } from '@/common/composables/useGameAPI';

const props = defineProps<{
  currentGame: LobbyGame;
  playerId: string;
}>();

const emit = defineEmits<{
  back: [];
  startGame: [];
  leaveGame: [];
}>();

const lobbyStore = useLobbyStore();
const socketLobby = useSocketLobby();
const gameAPI = useGameAPI();
const { t } = useI18n();

const profileName = ref('');
const selectedPointsToWin = ref(300);
const profileError = ref<string | null>(null);
const pointsError = ref<string | null>(null);
const isSavingProfile = ref(false);
const isSavingPoints = ref(false);

const roomData = computed(() => lobbyStore.currentRoomData || props.currentGame);

const normalizedPlayerId = computed<PlayerId | null>(() => {
  const playerId = props.playerId as PlayerId;
  if (['player_1', 'player_2', 'player_3', 'player_4'].includes(playerId)) {
    return playerId;
  }
  return null;
});

const activePlayers = computed(() => roomData.value.activePlayers || []);

const currentPlayerProfile = computed(() => {
  if (!normalizedPlayerId.value) return null;
  return activePlayers.value.find(player => player.id === normalizedPlayerId.value) || null;
});

const currentPlayers = computed(() => activePlayers.value.length || roomData.value.currentPlayers);

const isHost = computed(() => lobbyStore.isHost(props.playerId));

const availableColors = computed(() => getAvailablePlayerColors());

const takenColorsByOthers = computed(() => {
  if (!normalizedPlayerId.value) return new Set<string>();
  return new Set(
    activePlayers.value
      .filter(player => player.id !== normalizedPlayerId.value)
      .map(player => player.color)
  );
});

const isColorTakenByOtherPlayer = (color: string) => takenColorsByOthers.value.has(color);

watch(currentPlayerProfile, (profile) => {
  if (!profile) return;
  profileName.value = profile.name;
}, { immediate: true });

watch(() => roomData.value.pointsToWin, (pointsToWin) => {
  selectedPointsToWin.value = pointsToWin || 300;
}, { immediate: true });

const saveProfileName = async () => {
  if (!normalizedPlayerId.value || !currentPlayerProfile.value) return;

  const nextName = profileName.value.trim();
  if (nextName.length > 15) {
    profileError.value = 'Name must be 15 characters or less';
    return;
  }

  if (nextName === currentPlayerProfile.value.name) {
    profileError.value = null;
    return;
  }

  try {
    isSavingProfile.value = true;
    profileError.value = null;
    await gameAPI.updatePlayerProfile(roomData.value.gameId, normalizedPlayerId.value, { name: nextName });
  } catch (error) {
    profileError.value = error instanceof Error ? error.message : 'Failed to update name';
  } finally {
    isSavingProfile.value = false;
  }
};

const saveProfileColor = async (color: string) => {
  if (!normalizedPlayerId.value || !currentPlayerProfile.value) return;
  if (isColorTakenByOtherPlayer(color)) {
    profileError.value = 'Color already taken by another player';
    return;
  }
  if (color === currentPlayerProfile.value.color) {
    profileError.value = null;
    return;
  }

  try {
    isSavingProfile.value = true;
    profileError.value = null;
    await gameAPI.updatePlayerProfile(roomData.value.gameId, normalizedPlayerId.value, { color });
  } catch (error) {
    profileError.value = error instanceof Error ? error.message : 'Failed to update color';
  } finally {
    isSavingProfile.value = false;
  }
};

const updatePointsToWin = async () => {
  if (!isHost.value) return;
  if (selectedPointsToWin.value === roomData.value.pointsToWin) return;

  try {
    isSavingPoints.value = true;
    pointsError.value = null;
    await gameAPI.updatePointsToWin(roomData.value.gameId, selectedPointsToWin.value);
  } catch (error) {
    pointsError.value = error instanceof Error ? error.message : 'Failed to update points to win';
  } finally {
    isSavingPoints.value = false;
  }
};

const pointsOptions = [50, 150, 200, 250, 300, 350, 400];

onMounted(() => {
  const userId = userIdService.getUserId();
  socketLobby.joinLobby({ 
    gameId: props.currentGame.gameId, 
    playerId: props.playerId as import('@domain/interfaces/Player').PlayerId,
    userId 
  });
  
  socketLobby.onGameDeleted(({ message }) => {
    alert(message || 'The host has left. Game deleted.');
    emit('back');
  });
});

onUnmounted(() => {
  socketLobby.offGameDeleted();
});

</script>

<template>
  <div class="flex flex-col gap-4" data-testid="room-menu">
    <ActionButton 
      data-testid="room-back-btn"
      :label="t('lobby.backToMenu')" 
      variant="tertiary"
      @click="emit('back')"
    />
    
    <div class="text-center">
      <p v-if="isHost" class="text-hasen-green font-semibold">{{ t('lobby.youAreHost') }}</p>
      <div class="mt-4 space-y-3">
        <p class="text-black font-semibold" data-testid="room-players-count">
          {{ t('lobby.players') }}: {{ currentPlayers }} / {{ roomData.maxPlayers }}
        </p>

        <div class="text-left rounded-lg bg-hasen-light/50 p-3 space-y-3">
          <!-- <p class="text-sm font-semibold text-hasen-dark">Players</p> -->
          <div
            v-for="player in activePlayers"
            :key="player.id"
            class="flex items-center justify-between gap-3"
          >
            <span class="text-sm text-hasen-dark">{{ player.name }}</span>
            <span
              class="h-4 w-4 rounded-full border border-hasen-dark/40"
              :style="{ backgroundColor: player.color }"
            ></span>
          </div>
        </div>

        <div v-if="currentPlayerProfile" class="text-left rounded-lg bg-hasen-light/50 p-3 space-y-2">
          <p class="text-sm font-semibold text-hasen-dark">Your profile</p>
          <input
            v-model="profileName"
            type="text"
            maxlength="15"
            class="input input-bordered w-full bg-white text-black"
            placeholder="Your name"
            :disabled="isSavingProfile"
            @blur="saveProfileName"
            @keydown.enter.prevent="saveProfileName"
          />

          <div class="grid grid-cols-8 gap-1">
            <button
              v-for="color in availableColors"
              :key="color"
              type="button"
              class="h-7 w-full rounded-md border-2 transition-opacity disabled:opacity-30"
              :class="currentPlayerProfile.color === color ? 'border-hasen-dark' : 'border-transparent'"
              :style="{ backgroundColor: color }"
              :disabled="isColorTakenByOtherPlayer(color) || isSavingProfile"
              @click="saveProfileColor(color)"
            />
          </div>

          <p v-if="profileError" class="text-xs text-hasen-red">{{ profileError }}</p>
        </div>

        <div class="text-left rounded-lg bg-hasen-light/50 p-3 space-y-2">
          <p class="text-sm font-semibold text-hasen-dark">Points to win</p>
          <select
            v-model="selectedPointsToWin"
            class="select select-bordered w-full bg-white text-black"
            :disabled="!isHost || isSavingPoints"
            @change="updatePointsToWin"
          >
            <option v-for="option in pointsOptions" :key="option" :value="option">
              {{ option }} points
            </option>
          </select>
          <p v-if="!isHost" class="text-xs text-hasen-dark/70">Only host can change this setting.</p>
          <p v-if="pointsError" class="text-xs text-hasen-red">{{ pointsError }}</p>
        </div>
      </div>
    </div>
    
    <div class="text-center text-gray-500 mt-4">
      {{ t('lobby.waitingForPlayers') }}
    </div>

    <ActionButton 
      v-if="isHost"
      data-testid="room-start-game-btn"
      :label="t('lobby.startGame')"
      variant="primary"
      :disabled="currentPlayers < roomData.minPlayers"
      @click="emit('startGame')"
    />

    <ActionButton 
      data-testid="room-leave-game-btn"
      :label="isHost ? t('lobby.deleteGame') : t('lobby.leaveGame')"
      variant="danger"
      @click="emit('leaveGame')"
    />
  </div>
</template>