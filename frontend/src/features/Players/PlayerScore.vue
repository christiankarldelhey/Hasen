<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useHasenStore } from '@/stores/hasenStore'
import { usePlayerScore } from '@/common/composables/usePlayerScore'
import SuitSymbol from '@/common/components/SuitSymbol.vue'
import TrickSymbol from '@/common/components/TrickSymbol.vue'
import PointsToWin from '@/common/components/PointsToWin.vue'
import PlayerBidScore from '@/features/Bids/PlayerBidScore.vue'

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

const { trickDisplays, isBidLost, setCollectionDisplay, pointsDisplay, trickBid, setCollectionBid, pointsBid } = usePlayerScore(
  playerBids,
  tricksWon,
  currentTrick,
  allBids,
  setCollection
)

const suitOrder = ['acorns', 'leaves', 'berries'] as const

const suitDisplays = computed(() => {
  const displays = suitOrder.map(suit => {
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
  
  // When setCollectionDisplay is active, reorder: winSuit first, avoidSuit second, hide the third
  if (setCollectionDisplay.value) {
    return displays
      .filter(d => d.isWin || d.isAvoid)
      .sort((a, b) => {
        if (a.isWin) return -1
        if (b.isWin) return 1
        return 0
      })
  }
  
  return displays
})

const trickBidScore = computed(() => {
  if (!trickBid.value) return { score: null, onLose: null }
  const bidEntry = playerBids.value.find(entry => entry.bidId === trickBid.value?.bid_id)
  return {
    score: trickBid.value.bid_score,
    onLose: bidEntry?.onLose ?? null
  }
})

const setCollectionBidScore = computed(() => {
  if (!setCollectionBid.value) return { score: null, onLose: null }
  return {
    score: setCollectionBid.value.bid.bid_score,
    onLose: setCollectionBid.value.entry.onLose
  }
})

const pointsBidScore = computed(() => {
  if (!pointsBid.value) return { score: null, onLose: null }
  return {
    score: pointsBid.value.bid.bid_score,
    onLose: pointsBid.value.entry.onLose
  }
})
</script>

<template>
  <div class="rounded-xl px-4 py-2 shadow-lg w-full bg-hasen-base flex flex-col">

    <!-- Row: Tricks Won -->
    <div class="flex-1 flex flex-row items-center gap-1 border-b border-hasen-dark min-h-12 py-2 px-1">
      <div v-if="isBidLost" class="text-hasen-red text-lg font-semibold">
        You lose this bid
      </div>
      <div v-else class="flex flex-row items-center gap-1">
        <TrickSymbol
          v-for="trick in trickDisplays"
          size="large"
          :key="trick.trickNumber"
          :state="trick.state"
          :char="trick.trickNumber"
          :style="{ opacity: trick.opacity }"
        />
      </div>
      <PlayerBidScore 
        :score="trickBidScore.score" 
        :onLose="trickBidScore.onLose"
        :showLose="true"
      />
    </div>

    <!-- Row: Points -->
    <div class="flex-1 flex flex-row items-center justify-between py-2 px-0 border-b border-hasen-dark">
      <PointsToWin size="medium" :points="pointsDisplay ? pointsDisplay.minPoints : 0" :class="pointsDisplay ? '' : 'opacity-30'" />
      <span class="text-hasen-dark text-2xl">
        {{ points }}
      </span>
      <PointsToWin size="medium" :points="pointsDisplay ? pointsDisplay.maxPoints : 100" :class="pointsDisplay ? '' : 'opacity-30'" />
      <PlayerBidScore 
        :score="pointsBidScore.score" 
        :onLose="pointsBidScore.onLose"
        :showLose="true"
      />
    </div>

    <!-- Row: Set Collection -->
    <div class="flex-1 flex flex-row items-center justify-between py-3">
      <div v-for="suitDisplay in suitDisplays" :key="suitDisplay.suit" class="flex flex-row items-center gap-1">
        <SuitSymbol 
          :suit="suitDisplay.suit" 
          :avoid="suitDisplay.isAvoid"
          :class="!suitDisplay.isWin && !suitDisplay.isAvoid && setCollectionDisplay ? 'opacity-70' : ''"
        />
        <span 
          class="text-lg font-semibold"
          :class="[
            suitDisplay.isAvoid ? 'text-hasen-red' : 'text-hasen-dark',
            !suitDisplay.isWin && !suitDisplay.isAvoid && setCollectionDisplay ? 'opacity-70' : ''
          ]"
        >
          {{ suitDisplay.score !== null ? suitDisplay.score : suitDisplay.count }}
        </span>
      </div>
      <PlayerBidScore 
        :score="setCollectionBidScore.score" 
        :onLose="setCollectionBidScore.onLose"
        :showLose="true"
        :winSuit="setCollectionDisplay?.winSuit ?? null"
        :avoidSuit="setCollectionDisplay?.avoidSuit ?? null"
      />
    </div>
  </div>
</template>
