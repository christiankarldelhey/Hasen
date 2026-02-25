<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { AVAILABLE_PLAYERS } from '@domain/interfaces/Player'
import { IconStar, IconStarFilled } from '@tabler/icons-vue'
import PlayerAvatar from '@/common/components/PlayerAvatar.vue'
import acornIcon from '@/assets/symbols/acorn.png'
import berryIcon from '@/assets/symbols/berry.png'
import leaveIcon from '@/assets/symbols/leave.png'

const gameStore = useGameStore()

const currentTrick = computed(() => gameStore.publicGameState?.round.currentTrick)
const leadSuit = computed(() => currentTrick.value?.lead_suit)
// const trickNumber = computed(() => currentTrick.value?.trick_number)
const pointsToWin = computed(() => gameStore.publicGameState?.gameSettings.pointsToWin ?? 0)

const suitIcons: Record<string, string> = {
  'acorns': acornIcon,
  'berries': berryIcon,
  'leaves': leaveIcon
}

const leadSuitIcon = computed(() => {
  if (!leadSuit.value) return null
  return suitIcons[leadSuit.value]
})

const sortedPlayerScores = computed(() => {
  const scores = gameStore.publicGameState?.playerScores || []
  
  return [...scores]
    .map(ps => {
      const player = AVAILABLE_PLAYERS.find(p => p.id === ps.playerId)
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
    <!-- Ranking de jugadores ordenado por score -->
      <div class="flex flex-row w-full justify-end">
          <!-- <div class="flex items-center">
            <span class="text-sm pr-2 text-hasen-base">Lead:</span>
              <div v-if="leadSuitIcon" 
                class="w-4 flex">
                <img 
                  :src="leadSuitIcon" 
                  alt="Lead suit" 
                  class="w-full h-full object-contain" 
                />
              </div>
              <div v-else 
                class="w-4 flex items-center text-hasen-base justify-center text-sm">
                ?
              </div>
          </div> -->
        <div v-if="pointsToWin" class="flex items-center align-right px-1 shadow-md">
          <IconStarFilled :size="14" class="text-hasen-base" />
          <span class="pl-1 text-hasen-base text-md">{{ pointsToWin }}</span>
        </div>
      </div>
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
