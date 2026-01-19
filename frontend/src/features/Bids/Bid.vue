<script setup lang="ts">
import { computed } from 'vue'
import type { Bid, BidType } from '@domain/interfaces/Bid'
import type { PlayerId } from '@domain/interfaces/Player'
import WinCondition from './WinCondition.vue'
import BidScore from './BidScore.vue'
import Hare from '@/common/components/Hare.vue'
import { useSocketGame } from '@/common/composables/useSocketGame'
import { useGameStore } from '@/stores/gameStore'

const props = defineProps<{
  bid: Bid | null
  type: BidType
}>()

const socketGame = useSocketGame()
const gameStore = useGameStore()

const bidders = computed<PlayerId[]>(() => {
  if (!props.bid?.current_bids) return []
  
  const biddersArray: PlayerId[] = []
  
  Object.values(props.bid.current_bids).forEach((playerBid) => {
    if (playerBid.bidder) {
      biddersArray.push(playerBid.bidder)
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
    <div class="bg-hasen-base rounded-xl px-1.5 py-2 shadow-lg max-h-16 min-w-64 cursor-pointer 
            transition-all duration-150
            hover:bg-opacity-80 hover:shadow-xl hover:scale-[1.02]
            active:scale-100" 
     @click="handleBidClick">
      <div class="flex flex-row items-stretch">
        <BidScore :score="bid.bid_score" :bidders="bidders" />
        <div class="w-[60%] flex flex-row items-center justify-center gap-2 min-w-0">
          <WinCondition :type="bid?.bid_type" :win_condition="bid?.win_condition" />
        </div>
        <div class="border-l border-hasen-dark w-[20%] min-w-0 flex items-center justify-center">
          <div class="relative w-12 h-12 flex justify-center items-center">
            <Hare 
              v-if="bidders.length >= 2 && bidders[1]" 
              class="hare-2 absolute top-1 left-2 z-10" 
              :player-id="bidders[1]" 
              size="32" />
            <Hare 
              v-if="bidders.length >= 1 && bidders[0]" 
              class="hare-1 absolute top-1 left-4 z-0" 
              :player-id="bidders[0]" 
              size="32px" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
