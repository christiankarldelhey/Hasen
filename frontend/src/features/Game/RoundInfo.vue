<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { AVAILABLE_PLAYERS } from '@domain/interfaces/Player'
import { IconTrophyFilled, IconStar } from '@tabler/icons-vue'
import PlayerAvatar from '@/common/components/PlayerAvatar.vue'
import acornIcon from '@/assets/symbols/acorn.png'
import berryIcon from '@/assets/symbols/berry.png'
import leaveIcon from '@/assets/symbols/leave.png'
import trickIcon from '@/assets/symbols/trick.png'

const gameStore = useGameStore()

const currentTrick = computed(() => gameStore.publicGameState?.round.currentTrick)
const leadSuit = computed(() => currentTrick.value?.lead_suit)
const trickNumber = computed(() => currentTrick.value?.trick_number)

const suitIcons: Record<string, string> = {
  'acorns': acornIcon,
  'berries': berryIcon,
  'leaves': leaveIcon
}

const leadSuitIcon = computed(() => {
  if (!leadSuit.value) return null
  return suitIcons[leadSuit.value]
})

const pointsToWin = computed(() => gameStore.publicGameState?.gameSettings.pointsToWin ?? 0)

const sortedPlayerScores = computed(() => {
  const scores = gameStore.publicGameState?.playerScores || []
  
  // If scores is empty, populate with all available players
  if (scores.length === 0) {
    return AVAILABLE_PLAYERS
      .map(player => ({
        playerId: player.id,
        score: 0,
        color: player.color,
        name: player.name
      }))
      .sort((a, b) => b.score - a.score)
  }
  
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
  <!-- <div class="bg-transparent flex flex-col items-start gap-5">
    
      <div v-if="currentTrick" 
        class="bg-hasen-base rounded-full px-2 py-2 shadow-lg flex items-center justify-center">
          <div v-if="leadSuitIcon" 
            class="w-8 h-8 flex items-center justify-center">
            <img 
              :src="leadSuitIcon" 
              alt="Lead suit" 
              class="w-full h-full object-contain" 
            />
          </div>
          <div v-else 
            class="w-8 h-8 opacity-70 flex items-center justify-center text-hasen-dark text-2xl font-bold">
            ?
          </div>
      </div>

      <div v-if="trickNumber" class="relative w-12 h-16 flex items-center justify-center">
        <img :src="trickIcon" alt="Trick" class="w-full h-full object-contain" />
        <div class="absolute inset-0 flex items-center opacity-70 justify-center text-hasen-dark text-2xl font-semibold">
          {{ trickNumber }}
        </div>
      </div>
    
  </div> -->
  <div class="bg-transparent flex flex-col items-start gap-2">
    <!-- Objetivo: puntos para ganar -->
    <!-- <div v-if="pointsToWin" class="flex items-center gap-1 bg-hasen-dark/80 rounded-full px-3 py-1 shadow-md">
      <IconTrophyFilled :size="14" class="text-yellow-400" />
      <IconStarFilled :size="10" class="text-yellow-400" />
      <span class="text-hasen-base text-xs font-bold">{{ pointsToWin }}</span>
    </div> -->

    <!-- Ranking de jugadores ordenado por score -->
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
