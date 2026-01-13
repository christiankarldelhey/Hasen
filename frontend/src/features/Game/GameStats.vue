<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const gameStore = useGameStore()

const currentPhase = computed(() => gameStore.currentPhase)

const phaseLabels: Record<string, string> = {
  'round_setup': 'Round setup',
  'player_drawing': 'Player drawing',
  'playing': 'Playing',
  'scoring': 'Scoring'
}

const phaseLabel = computed(() => phaseLabels[currentPhase.value] || currentPhase.value)
</script>

<template>
  <div class="fixed top-4 left-[140px] z-10">
    <div class="bg-hasen-base rounded-tl-2xl rounded-tr-2xl rounded-br-2xl px-6 py-4 shadow-lg">
      <div class="text-hasen-dark text-lg font-semibold">
        Phase: {{ phaseLabel }}
      </div>
    </div>
  </div>
</template>