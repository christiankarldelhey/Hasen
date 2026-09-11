<script setup lang="ts">
import { computed } from 'vue'
import type { PlayerId } from '@domain/interfaces/Player'
import { usePlayers } from '@/features/Players/composables/usePlayers'
import { useI18n } from '@/common/composables/useI18n'

interface Props {
  playerId: PlayerId
  showYou?: boolean
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  showYou: true,
  size: 'medium'
})

const { t } = useI18n()
const { getPlayerNameById, getPlayerColorById, isCurrentPlayer } = usePlayers()

const playerName = computed(() => getPlayerNameById.value(props.playerId))
const playerColor = computed(() => getPlayerColorById.value(props.playerId))
const showYouSuffix = computed(() => props.showYou && isCurrentPlayer.value(props.playerId))

const sizeClasses = {
  small: 'text-xs',
  medium: 'text-sm',
  large: 'text-base'
}
</script>

<template>
  <span 
    :class="['font-semibold', sizeClasses[size]]"
    :style="{ color: playerColor }"
  >
    {{ playerName }}
    <span v-if="showYouSuffix" class="opacity-70"> {{ t('common.you') }}</span>
  </span>
</template>
