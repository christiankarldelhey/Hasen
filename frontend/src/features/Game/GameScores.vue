<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { usePlayers } from '@/features/Players/composables/usePlayers'
import { IconStar } from '@tabler/icons-vue'
import PlayerAvatar from '@/common/components/PlayerAvatar.vue'
const gameStore = useGameStore()
const { getPlayerById } = usePlayers()


const sortedPlayerScores = computed(() => {
  const scores = gameStore.publicGameState?.playerScores || []
  
  return [...scores]
    .map(ps => {
      const player = getPlayerById.value(ps.playerId)
      return {
        ...ps,
        color: player?.color || '#000000',
        name: player?.name || 'Player',
        score: ps.score ?? 0
      }
    })
    .sort((a, b) => b.score - a.score)
})
</script>

<template>

  <div class="bg-transparent flex flex-col items-start gap-1.5">
    <div 
      v-for="ps in sortedPlayerScores" 
      :key="ps.playerId"
      class="rounded-xl px-1 py-1 max-h-16 min-w-36 bg-hasen-base flex flex-row justify-between items-center gap-1"
    >
    <div class="flex flex-row items-center gap-2">
      <PlayerAvatar :playerId="ps.playerId" size="tiny" />
      <span class="text-xs text-hasen-dark">{{ ps.name }}</span>
    </div>
    <div class="flex flex-row items-center gap-1 pr-2">
      <IconStar class="text-hasen-dark" :size="12" />
      <span :class="['text-md font-semibold', ps.score >= 0 ? 'text-hasen-dark' : 'text-hasen-red']">{{ ps.score }}</span>
    </div>
    </div>
  </div>
</template>
