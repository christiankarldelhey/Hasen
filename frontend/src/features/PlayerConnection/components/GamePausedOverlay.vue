<script setup lang="ts">
import { computed } from 'vue'
import { usePlayers } from '@/features/Players/composables/usePlayers'
import { useI18n } from '@/common/composables/useI18n'
import PlayerAvatar from '@/common/components/PlayerAvatar.vue'
import PlayerConnectionBadge from './PlayerConnectionBadge.vue'
import type { PlayerId } from '@domain/interfaces/Player'

const props = defineProps<{
  isPaused: boolean
  pauseReason: 'player_disconnected' | null
  disconnectedPlayerIds: PlayerId[]
}>()

const { getPlayerNameById } = usePlayers()
const { t } = useI18n()

const getPlayerName = (playerId: PlayerId) => {
  return getPlayerNameById.value(playerId) || playerId
}

const disconnectedPlayerNames = computed(() => {
  return props.disconnectedPlayerIds
    .map(id => getPlayerName(id))
    .join(', ')
})
</script>

<template>
  <Transition name="fade">
    <div 
      v-if="isPaused && pauseReason === 'player_disconnected'" 
      class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000]"
    >
      <div class="bg-white rounded-2xl p-8 max-w-lg text-center shadow-2xl">
        <h2 class="text-2xl font-bold mb-2 text-gray-800">
          {{ t('game.gamePaused') }}
        </h2>
        <p class="text-base text-gray-600 mb-1">
          {{ t(disconnectedPlayerIds.length > 1 ? 'game.playersDisconnected' : 'game.playerDisconnected', { players: disconnectedPlayerNames }) }}
        </p>
        <p class="text-sm text-gray-400 mb-6">
          {{ t('game.waitingForReconnection') }}
        </p>
        <div class="flex flex-col gap-4 mt-6">
          <div 
            v-for="playerId in disconnectedPlayerIds" 
            :key="playerId"
            class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
          >
            <PlayerAvatar :player-id="playerId" size="medium" />
            <span class="flex-1 text-left font-medium text-gray-700">
              {{ getPlayerName(playerId) }}
            </span>
            <PlayerConnectionBadge :player-id="playerId" :status="'disconnected'" />
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
