<script setup lang="ts">
import { computed } from 'vue'
import type { PlayerId } from '@domain/interfaces/Player'
import { useGameStore } from '@/stores/gameStore'
import { useHasenStore } from '@/stores/hasenStore'
import { useGameScore } from '@/features/Score/composables/useGameScore'
import { usePlayerScore } from '@/features/Bids/composables/useBidPlayerScore'
import SuitSymbol from '@/common/components/SuitSymbol.vue'
import TrickSymbol from '@/common/components/TrickSymbol.vue'
import PointsToWin from '@/common/components/PointsToWin.vue'
import PlayerBidScoreRow from '@/features/Bids/PlayerBidScoreRow.vue'
import { AVAILABLE_PLAYERS } from '@domain/interfaces/Player'
import { IconStar } from '@tabler/icons-vue'

interface Props {
  playerId?: PlayerId
}

const props = defineProps<Props>()
const gameStore = useGameStore()
const hasenStore = useHasenStore()


const targetPlayerId = computed(() => props.playerId ?? hasenStore.currentPlayerId)

const { playerScore, playerRoundScore } = useGameScore(targetPlayerId.value)

const points = computed(() => playerRoundScore.value?.points ?? 0)

const setCollection = computed(() => playerRoundScore.value?.setCollection ?? {
  acorns: 0,
  leaves: 0,
  berries: 0,
  flowers: 0
})

const tricksWon = computed(() => playerRoundScore.value?.tricksWon ?? [])

const playerBids = computed(() => {
  if (!targetPlayerId.value || !gameStore.publicGameState?.round.roundBids.playerBids) {
    return []
  }
  return gameStore.publicGameState.round.roundBids.playerBids[targetPlayerId.value] || []
})

const currentTrick = computed(() => 
  gameStore.publicGameState?.round.currentTrick?.trick_number ?? 1
)

const allBids = computed(() => 
  gameStore.publicGameState?.round.roundBids.bids ?? []
)

const { trickDisplays, isBidLost, setCollectionDisplay, pointsDisplay, trickBid, setCollectionBid, pointsBid, suitDisplays } = usePlayerScore(
  playerBids,
  tricksWon,
  currentTrick,
  allBids,
  setCollection
)

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

const playerColor = computed(() => {
  const player = AVAILABLE_PLAYERS.find(p => p.id === targetPlayerId.value)
  return player?.color || '#B89B5E'
})

const bidsTitle = computed(() => {
  const isCurrentPlayer = targetPlayerId.value === hasenStore.currentPlayerId
  if (isCurrentPlayer) {
    return 'Round score'
  }
  const player = AVAILABLE_PLAYERS.find(p => p.id === targetPlayerId.value)
  return player ? `${player.name}'s round score` : 'Round score'
})
</script>

<template>
  <div class="rounded-xl bg-black/60 px-4 pb-4 pt-2 flex flex-col gap-2">
    <div class="flex flex-row items-center justify-between gap-2"> 
      <span class="text-hasen-base text-sm">{{ bidsTitle }}</span>
      <div class="flex flex-row items-center gap-1">
        <IconStar :size="16" class="text-hasen-base" /> 
        <span :class="['font-semibold text-lg', playerScore >= 0 ? 'text-hasen-base' : 'text-hasen-red']">{{ playerScore }}</span>
      </div>
    </div>
      

    <!-- Row: Tricks Won -->
    <PlayerBidScoreRow
      type="tricks"
      :isActive="trickBidScore.score !== null"
      :playerColor="playerColor"
      :score="trickBidScore.score"
      :onLose="trickBidScore.onLose"
    >
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
    </PlayerBidScoreRow>

    <!-- Row: Points -->
    <PlayerBidScoreRow
      type="points"
      :isActive="pointsBidScore.score !== null"
      :playerColor="playerColor"
      :score="pointsBidScore.score"
      :onLose="pointsBidScore.onLose"
    >
      <div class="flex flex-row items-center justify-between w-full">
        <PointsToWin size="medium" :points="pointsDisplay ? pointsDisplay.minPoints : 0" :class="pointsDisplay ? '' : 'opacity-30'" />
        <span 
          class="text-2xl"
          :class="pointsBidScore.score !== null && pointsDisplay 
            ? (points >= pointsDisplay.minPoints && points <= pointsDisplay.maxPoints ? 'text-hasen-green' : 'text-hasen-red')
            : 'text-hasen-dark'"
        >
          {{ points }}
        </span>
        <PointsToWin size="medium" :points="pointsDisplay ? pointsDisplay.maxPoints : 100" :class="pointsDisplay ? '' : 'opacity-30'" />
      </div>
    </PlayerBidScoreRow>

    <!-- Row: Set Collection -->
    <PlayerBidScoreRow
      type="setCollection"
      :isActive="setCollectionBidScore.score !== null"
      :playerColor="playerColor"
      :score="setCollectionBidScore.score"
      :onLose="setCollectionBidScore.onLose"
      :winSuit="setCollectionDisplay?.winSuit ?? null"
      :avoidSuit="setCollectionDisplay?.avoidSuit ?? null"
      :isLastRow="true"
    >
      <div v-if="suitDisplays[0] && suitDisplays[1]" class="flex flex-row items-center justify-between w-full">
          <SuitSymbol 
            :suit="suitDisplays[0].suit" 
            :avoid="suitDisplays[0].isAvoid"
            :value="suitDisplays[0].score !== null ? suitDisplays[0].score : suitDisplays[0].count"
            :class="[
              !setCollectionDisplay ? 'opacity-80' : '',
              !suitDisplays[0].isWin && !suitDisplays[0].isAvoid && setCollectionDisplay ? 'opacity-70' : ''
            ]"
          />
          
          <span 
            v-if="setCollectionDisplay"
            class="text-2xl font-semibold mx-2"
            :class="(setCollectionDisplay.winScore + setCollectionDisplay.avoidScore) < 10 ? 'text-hasen-red' : 'text-hasen-green'"
          >
            {{ setCollectionDisplay.winScore + setCollectionDisplay.avoidScore }}
          </span>

          <SuitSymbol 
            :suit="suitDisplays[1].suit" 
            :avoid="suitDisplays[1].isAvoid"
            :value="suitDisplays[1].score !== null ? suitDisplays[1].score : suitDisplays[1].count"
            :class="[
              !setCollectionDisplay ? 'opacity-80' : '',
              !suitDisplays[1].isWin && !suitDisplays[1].isAvoid && setCollectionDisplay ? 'opacity-70' : ''
            ]"
          />
        </div>
    </PlayerBidScoreRow>

  </div>
</template>
