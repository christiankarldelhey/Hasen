<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/common/composables/useI18n'
import type { PlayerId, PlayerConnectionStatus } from '@domain/interfaces/Player'

const props = defineProps<{
  playerId: PlayerId
  status: PlayerConnectionStatus
}>()

const { t } = useI18n()

const isDisconnected = computed(() => 
  props.status === 'disconnected' || props.status === 'reconnecting'
)

const isReconnecting = computed(() => props.status === 'reconnecting')

const statusText = computed(() => 
  isReconnecting.value ? t('game.reconnecting') : t('game.disconnected')
)
</script>

<template>
  <div 
    v-if="isDisconnected" 
    :class="[
      'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border',
      isReconnecting 
        ? 'bg-amber-50 border-amber-300 text-amber-600' 
        : 'bg-red-50 border-red-300 text-red-600'
    ]"
  >
    <span class="w-2 h-2 rounded-full bg-current animate-pulse"></span>
    <span class="whitespace-nowrap">{{ statusText }}</span>
  </div>
</template>
