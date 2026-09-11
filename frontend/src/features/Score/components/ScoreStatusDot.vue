<script setup lang="ts">
import { computed } from 'vue'
import type { PlayerId } from '@domain/interfaces/Player'
import { usePlayerObjectiveStatus } from '../composables/usePlayerObjectiveStatus'

const props = defineProps<{ playerId: PlayerId }>()

const idRef = computed(() => props.playerId)
const { status } = usePlayerObjectiveStatus(idRef)

const dotClass = computed(() => {
  if (status.value === 'winning') return 'bg-hasen-green'
  if (status.value === 'losing') return 'bg-hasen-red'
  return 'hidden'
})
</script>

<template>
  <span :class="['w-2 h-2 rounded-full', dotClass]" />
</template>
