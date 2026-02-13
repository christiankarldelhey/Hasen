<script setup lang="ts">
import { computed } from 'vue'
import { usePlayers } from '@/features/Players/composables/usePlayers'
import { useI18n } from '@/common/composables/useI18n'
import BaseModal from '@/common/components/BaseModal.vue'
import ActionButton from '@/common/components/ActionButton.vue'
import PlayerAvatar from '@/common/components/PlayerAvatar.vue'
import PlayerConnectionBadge from './PlayerConnectionBadge.vue'
import type { PlayerId } from '@domain/interfaces/Player'

const props = defineProps<{
  isPaused: boolean
  pauseReason: 'player_disconnected' | null
  disconnectedPlayerIds: PlayerId[]
  remainingSeconds: number | null
  interruptionReason: 'player_left_game' | 'player_disconnect_timeout' | null
  interruptedPlayerId: PlayerId | null
}>()

const emit = defineEmits<{
  confirmInterruption: []
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

const formattedRemainingTime = computed(() => {
  if (props.remainingSeconds === null) {
    return null
  }

  const minutes = Math.floor(props.remainingSeconds / 60)
  const seconds = props.remainingSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

const shouldShowPausedModal = computed(() => props.isPaused && props.pauseReason === 'player_disconnected')

const interruptionMessage = computed(() => {
  if (!props.interruptionReason || !props.interruptedPlayerId) {
    return ''
  }

  return t('game.playerDisconnectedFromMatch', {
    player: getPlayerName(props.interruptedPlayerId)
  })
})
</script>

<template>
  <BaseModal
    :isOpen="shouldShowPausedModal"
    :title="t('game.gamePaused')"
    maxWidth="lg"
    @close="() => {}"
  >
    <p class="text-base text-hasen-dark mb-1">
      {{ t(disconnectedPlayerIds.length > 1 ? 'game.playersDisconnected' : 'game.playerDisconnected', { players: disconnectedPlayerNames }) }}
    </p>
    <p class="text-sm text-hasen-dark/60 mb-3">
      {{ t('game.waitingForReconnection') }}
    </p>
    <p v-if="formattedRemainingTime" class="text-sm font-semibold text-hasen-red mb-5">
      {{ t('game.matchEndsInCountdown', { time: formattedRemainingTime }) }}
    </p>

    <div class="flex flex-col gap-3">
      <div
        v-for="playerId in disconnectedPlayerIds"
        :key="playerId"
        class="flex items-center gap-4 p-3 bg-hasen-dark/5 rounded-lg"
      >
        <PlayerAvatar :player-id="playerId" size="medium" />
        <span class="flex-1 text-left font-medium text-hasen-dark">
          {{ getPlayerName(playerId) }}
        </span>
        <PlayerConnectionBadge :player-id="playerId" :status="'disconnected'" />
      </div>
    </div>
  </BaseModal>

  <BaseModal
    :isOpen="Boolean(interruptionReason)"
    :title="t('game.gameInterrupted')"
    maxWidth="sm"
    @close="() => {}"
  >
    <p class="text-base text-hasen-dark">{{ interruptionMessage }}</p>

    <template #footer>
      <ActionButton :label="t('common.confirm')" variant="primary" @click="emit('confirmInterruption')" />
    </template>
  </BaseModal>
</template>
