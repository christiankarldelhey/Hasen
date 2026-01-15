<script setup lang="ts">
import type { Bid, BidType } from '@domain/interfaces/Bid'
import Hare from '../../common/components/Hare.vue'
import WinCondition from './WinCondition.vue'
import { useSocketGame } from '@/common/composables/useSocketGame'
import { useGameStore } from '@/stores/gameStore'

const props = defineProps<{
  bid: Bid | null
  type: BidType
}>()

const socketGame = useSocketGame()
const gameStore = useGameStore()

const handleBidClick = () => {
  if (!props.bid) return
  
  const gameId = gameStore.publicGameState?.gameId
  const currentTrick = gameStore.publicGameState?.round.currentTrick
  
  if (!gameId || !currentTrick) {
    console.warn('Cannot make bid: missing gameId or currentTrick')
    return
  }
  
  const trickNumber = currentTrick.trick_number
  
  socketGame.makeBid(gameId, props.type, trickNumber)
  console.log(`🎯 Making bid: ${props.type} on trick ${trickNumber}`)
}
</script>

<template>
  <div v-if="bid" class="bg-hasen-base rounded-2xl px-2 py-3 shadow-lg max-h-20 cursor-pointer" @click="handleBidClick">
    <div class="flex flex-row">
       <div class="avatar avatar-placeholder">
        <div class="bg-hasen-green w-12 h-12 rounded-full border-2 border-hasen-dark">
          <span class="text-2xl text-hasen-dark">{{ bid?.bid_score }}</span>
        </div>
      </div>
      <WinCondition :type="bid?.bid_type" :win_condition="bid?.win_condition" />
    </div>
  </div>
</template>
