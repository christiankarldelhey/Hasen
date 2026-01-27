<script setup lang="ts">
import { computed } from 'vue'
import type { Bid, BidType } from '@domain/interfaces/Bid'
import type { PlayerId } from '@domain/interfaces/Player'
import { AVAILABLE_PLAYERS } from '@domain/interfaces/Player'
import WinCondition from './BidWinCondition.vue'
import BidScore from './BidScore.vue'
import Hare from '@/common/components/Hare.vue'
import { useSocketGame } from '@/common/composables/useSocketGame'
import { useGameStore } from '@/stores/gameStore'
import { useHasenStore } from '@/stores/hasenStore'

const props = defineProps<{
  bid: Bid | null
  type: BidType
  disabled?: boolean
}>()

const socketGame = useSocketGame()
const gameStore = useGameStore()
const hasenStore = useHasenStore()

const bidders = computed<PlayerId[]>(() => {
  if (!props.bid) return []
  
  const playerBids = gameStore.publicGameState?.round.roundBids.playerBids
  if (!playerBids) return []
  
  const biddersSet = new Set<PlayerId>()
  
  Object.entries(playerBids).forEach(([playerId, bids]) => {
    if (bids.some(b => b.bidId === props.bid!.bid_id)) {
      biddersSet.add(playerId as PlayerId)
    }
  })
  
  return Array.from(biddersSet)
})

const currentPlayerBidColor = computed(() => {
  const currentPlayerId = hasenStore.currentPlayerId
  if (!currentPlayerId || !bidders.value.includes(currentPlayerId)) return null
  
  const player = AVAILABLE_PLAYERS.find(p => p.id === currentPlayerId)
  return player?.color || null
})

const bidCardClasses = computed(() => {
  const baseClasses = 'rounded-xl px-1 py-1 shadow-lg max-h-16 min-w-64 transition-all duration-150 relative'
  const stateClasses = props.disabled 
    ? 'bg-hasen-base cursor-not-allowed bg-color-hasen' 
    : 'cursor-pointer bg-hasen-light hover:shadow-xl hover:scale-[1.02] active:scale-100 bid-clickable'
  
  return `${baseClasses} ${stateClasses}`
})

const bidCardStyle = computed(() => {
  if (!currentPlayerBidColor.value) return {}
  
  return {
    borderLeft: `4px solid ${currentPlayerBidColor.value}`
  }
})

const handleBidClick = () => {
  if (!props.bid || props.disabled) return
  
  const gameId = gameStore.publicGameState?.gameId
  const currentTrick = gameStore.publicGameState?.round.currentTrick
  
  if (!gameId || !currentTrick) {
    console.warn('Cannot make bid: missing gameId or currentTrick')
    return
  }
  
  const trickNumber = currentTrick.trick_number
  
  socketGame.makeBid(gameId, props.type, trickNumber, props.bid.bid_id)
  console.log(`🎯 Making bid: ${props.type} (${props.bid.bid_id}) on trick ${trickNumber}`)
}
</script>

<template>
  <div v-if="bid" class="flex flex-row items-center gap-2">    
    <!-- Bid card -->
    <div 
      :class="bidCardClasses"
      :style="bidCardStyle"
      @click="handleBidClick"
    >
      <div class="flex flex-row items-stretch">
        <BidScore :score="bid.bid_score" :bidders="bidders" />
        <div class="w-[60%] flex flex-row items-center justify-center gap-2 min-w-0">
          <WinCondition :type="bid?.bid_type" :win_condition="bid?.win_condition" />
        </div>
        <div class="border-l border-hasen-dark w-[20%] min-w-0 flex items-center justify-center">
          <div class="relative w-12 h-12 flex justify-center items-center">
            <Hare 
              v-if="bidders.length >= 1 && bidders[0]" 
              :class="'hare-1 absolute z-0 ' + (bidders.length === 2 ? 'top-1 left-4' : 'top-1 left-3')" 
              :player-id="bidders[0]" 
              size="32px" />
            <Hare 
              v-if="bidders.length >= 2 && bidders[1]" 
              class="hare-2 absolute top-1 left-2 z-10" 
              :player-id="bidders[1]" 
              size="32" />

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

