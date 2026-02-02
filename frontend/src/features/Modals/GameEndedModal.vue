<script setup lang="ts">
import { computed } from 'vue'
import { AVAILABLE_PLAYERS, type PlayerId } from '@domain/interfaces/Player'
import type { PlayerScore } from '@domain/interfaces/Game'
import BaseModal from '@/common/components/BaseModal.vue'
import PlayerAvatar from '@/common/components/PlayerAvatar.vue'

interface Props {
  isOpen: boolean
  playerScores: PlayerScore[]
  winner: PlayerId | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  newGame: []
}>()

interface PlayerRankInfo {
  playerId: PlayerId
  playerName: string
  playerColor: string
  score: number
  rank: number
  isWinner: boolean
}

const rankedPlayers = computed<PlayerRankInfo[]>(() => {
  const sortedScores = [...props.playerScores].sort((a, b) => b.score - a.score)
  
  return sortedScores.map((playerScore, index) => {
    const player = AVAILABLE_PLAYERS.find(p => p.id === playerScore.playerId)
    
    return {
      playerId: playerScore.playerId,
      playerName: player?.name || 'Player',
      playerColor: player?.color || '#000000',
      score: playerScore.score,
      rank: index + 1,
      isWinner: playerScore.playerId === props.winner
    }
  })
})

const winnerInfo = computed(() => {
  return rankedPlayers.value.find(p => p.isWinner)
})

const handleNewGame = () => {
  emit('newGame')
  emit('close')
}
</script>

<template>
  <BaseModal :isOpen="isOpen" title="Game Has Ended" maxWidth="lg" @close="emit('close')">
    <!-- Winner Section -->
    <div v-if="winnerInfo" class="mb-6 text-center">
      <div class="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-xl border-2 border-yellow-400">
        <div class="relative">
          <PlayerAvatar :playerId="winnerInfo.playerId" size="large" showGlow />
          <!-- Crown -->
          <div class="absolute -top-6 left-1/2 transform -translate-x-1/2 text-4xl">
            👑
          </div>
        </div>
        <div>
          <h3 class="text-2xl font-bold text-hasen-dark mb-1">{{ winnerInfo.playerName }} Wins!</h3>
          <p class="text-lg font-semibold" :style="{ color: winnerInfo.playerColor }">
            {{ winnerInfo.score }} points
          </p>
        </div>
      </div>
    </div>

    <!-- Rankings -->
    <div class="space-y-3">
      <h4 class="font-bold text-lg text-hasen-dark mb-3">Final Rankings</h4>
      
      <div 
        v-for="playerInfo in rankedPlayers" 
        :key="playerInfo.playerId"
        :class="[
          'flex items-center gap-4 p-3 rounded-lg transition-all',
          playerInfo.isWinner ? 'bg-yellow-100/50' : 'bg-hasen-dark/5'
        ]"
      >
        <!-- Rank Badge -->
        <div 
          :class="[
            'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
            playerInfo.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
            playerInfo.rank === 2 ? 'bg-gray-300 text-gray-700' :
            playerInfo.rank === 3 ? 'bg-orange-300 text-orange-900' :
            'bg-hasen-dark/20 text-hasen-dark'
          ]"
        >
          {{ playerInfo.rank }}
        </div>

        <!-- Player Avatar -->
        <PlayerAvatar :playerId="playerInfo.playerId" size="small" />

        <!-- Player Info -->
        <div class="flex-1">
          <h5 class="font-bold">{{ playerInfo.playerName }}</h5>
        </div>

        <!-- Score -->
        <div class="text-right">
          <span 
            class="text-xl font-bold"
            :style="{ color: playerInfo.playerColor }"
          >
            {{ playerInfo.score }}
          </span>
          <span class="text-sm text-hasen-dark/50 ml-1">pts</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between gap-3">
        <button 
          @click="emit('close')"
          class="px-6 py-2 bg-hasen-dark/10 text-hasen-dark rounded-lg font-semibold hover:bg-hasen-dark/20 transition-colors"
        >
          Close
        </button>
        <button 
          @click="handleNewGame"
          class="px-6 py-2 bg-hasen-dark text-hasen-base rounded-lg font-semibold hover:bg-hasen-dark/80 transition-colors"
        >
          New Game
        </button>
      </div>
    </template>
  </BaseModal>
</template>
