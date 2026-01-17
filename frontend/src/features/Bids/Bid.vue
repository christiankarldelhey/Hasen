<script setup lang="ts">
import { computed } from 'vue'
import type { Bid, BidType } from '@domain/interfaces/Bid'
import type { PlayerId } from '@domain/interfaces/Player'
import type { TrickNumber } from '@domain/interfaces/Trick'
import WinCondition from './WinCondition.vue'
import { useSocketGame } from '@/common/composables/useSocketGame'
import { useGameStore } from '@/stores/gameStore'

const props = defineProps<{
  bid: Bid | null
  type: BidType
}>()

const socketGame = useSocketGame()
const gameStore = useGameStore()

interface BidderInfo {
  playerId: PlayerId
  trickNumber: TrickNumber
}

const bidders = computed<BidderInfo[]>(() => {
  if (!props.bid?.current_bids) return []
  
  const biddersArray: BidderInfo[] = []
  
  // Iterar sobre trick_1, trick_2, trick_3
  Object.entries(props.bid.current_bids).forEach(([key, playerBid]) => {
    if (playerBid.bidder) {
      const parts = key.split('_')
      if (parts[1]) {
        const trickNum = parseInt(parts[1]) as TrickNumber
        biddersArray.push({
          playerId: playerBid.bidder,
          trickNumber: trickNum
        })
      }
    }
  })
  
  return biddersArray
})

const handleBidClick = () => {
  if (!props.bid) return
  
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
    <div class="bg-hasen-base rounded-xl px-1.5 py-2 shadow-lg max-h-16 min-w-55 cursor-pointer" @click="handleBidClick">
      <div class="flex flex-row">
        <div class="avatar avatar-placeholder">
          <div class="bg-hasen-green w-10 h-10 rounded-full border-2 border-hasen-dark">
            <span class="text-xl text-hasen-base">{{ bid?.bid_score }}</span>
          </div>
        </div>
        <WinCondition :type="bid?.bid_type" :win_condition="bid?.win_condition" />
      </div>
    </div>
  </div>
</template>
