<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useHasenStore } from '@/stores/hasenStore'
import { usePlayerScore } from '@/common/composables/usePlayerScore'
import SuitSymbol from '@/common/components/SuitSymbol.vue'
import TrickSymbol from '@/common/components/TrickSymbol.vue'
import PointsToWin from '@/common/components/PointsToWin.vue'

const gameStore = useGameStore()
const hasenStore = useHasenStore()

const playerRoundScore = computed(() => {
  const roundScore = gameStore.publicGameState?.round.roundScore || []
  const currentPlayerId = hasenStore.currentPlayerId
  return roundScore.find((score) => score.playerId === currentPlayerId)
})

const points = computed(() => playerRoundScore.value?.points ?? 0)

const setCollection = computed(() => playerRoundScore.value?.setCollection ?? {
  acorns: 0,
  leaves: 0,
  berries: 0,
  flowers: 0
})

const tricksWon = computed(() => playerRoundScore.value?.tricksWon ?? [])

const playerBids = computed(() => {
  const currentPlayerId = hasenStore.currentPlayerId
  if (!currentPlayerId || !gameStore.publicGameState?.round.roundBids.playerBids) {
    return []
  }
  return gameStore.publicGameState.round.roundBids.playerBids[currentPlayerId] || []
})

const currentTrick = computed(() => 
  gameStore.publicGameState?.round.currentTrick?.trick_number ?? 1
)

const allBids = computed(() => 
  gameStore.publicGameState?.round.roundBids.bids ?? []
)

const { trickDisplays, isBidLost, setCollectionDisplay, pointsDisplay } = usePlayerScore(
  playerBids,
  tricksWon,
  currentTrick,
  allBids,
  setCollection
)

const suitOrder = ['acorns', 'leaves', 'berries'] as const

const suitDisplays = computed(() => {
  return suitOrder.map(suit => {
    const count = setCollection.value[suit] || 0
    
    if (!setCollectionDisplay.value) {
      return {
        suit,
        count,
        isWin: false,
        isAvoid: false,
        score: null
      }
    }
    
    const isWin = setCollectionDisplay.value.winSuit === suit
    const isAvoid = setCollectionDisplay.value.avoidSuit === suit
    
    return {
      suit,
      count,
      isWin,
      isAvoid,
      score: isWin ? setCollectionDisplay.value.winScore : (isAvoid ? setCollectionDisplay.value.avoidScore : null)
    }
  })
})
</script>

<template>
  <div class="rounded-xl px-6 py-5 shadow-lg w-full bg-hasen-base flex flex-col gap-2">
    <!-- Row: Tricks Won -->
    <div class="flex-1 flex flex-row items-center gap-1 border-b border-hasen-dark py-2">
      <div v-if="isBidLost" class="text-hasen-red text-lg font-semibold">
        You lose this bid
      </div>
      <div v-else class="flex flex-row items-center gap-1">
        <TrickSymbol
          v-for="trick in trickDisplays"
          :key="trick.trickNumber"
          :state="trick.state"
          :char="trick.trickNumber"
          :style="{ opacity: trick.opacity }"
        />
      </div>
    </div>

    <!-- Row: Set Collection -->
    <div class="flex-1 flex flex-row items-center gap-1">
      <div class="flex flex-row items-center gap-1">
        <template v-for="suitDisplay in suitDisplays" :key="suitDisplay.suit">
          <SuitSymbol 
            :suit="suitDisplay.suit" 
            :avoid="suitDisplay.isAvoid"
            :class="!suitDisplay.isWin && !suitDisplay.isAvoid && setCollectionDisplay ? 'opacity-70' : ''"
          />
          <span 
            class="text-lg font-semibold pr-2"
            :class="[
              suitDisplay.isAvoid ? 'text-hasen-red' : 'text-hasen-dark',
              !suitDisplay.isWin && !suitDisplay.isAvoid && setCollectionDisplay ? 'opacity-70' : ''
            ]"
          >
            {{ suitDisplay.score !== null ? suitDisplay.score : suitDisplay.count }}
          </span>
        </template>
      </div>
    </div>

    <!-- Row: Points -->
    <div class="flex-1 flex flex-row items-center justify-between">
      <span class="text-hasen-dark text-lg font-semibold" :class="pointsDisplay ? '' : 'opacity-30'">
        {{ pointsDisplay ? pointsDisplay.minPoints : 0 }}
      </span>
      <PointsToWin size="small" :points="points" />
      <span class="text-hasen-dark text-lg font-semibold" :class="pointsDisplay ? '' : 'opacity-30'">
        {{ pointsDisplay ? pointsDisplay.maxPoints : 100 }}
      </span>
    </div>
  </div>
</template>
