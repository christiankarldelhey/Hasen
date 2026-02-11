<script setup lang="ts">
import { computed } from 'vue'
import type { Bid, BidType } from '@domain/interfaces/Bid'
import type { PlayerId } from '@domain/interfaces/Player'
import { AVAILABLE_PLAYERS } from '@domain/interfaces/Player'
import WinCondition from './BidWinCondition.vue'
import BidScore from './BidScore.vue'
import { useSocketGame } from '@/common/composables/useSocketGame'
import { useGameStore } from '@/stores/gameStore'
import { useHasenStore } from '@/stores/hasenStore'
import { usePlayers } from '@/features/Players/composables/usePlayers'
import { useBidTooltips } from '@/common/composables/useBidTooltips'

const props = defineProps<{
  bid: Bid | null
  type: BidType
  disabled?: boolean
  disabledReason?: string
}>()

const { getTooltip } = useBidTooltips()

const socketGame = useSocketGame()
const gameStore = useGameStore()
const hasenStore = useHasenStore()
const { isPlayerTurn } = usePlayers()

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

const isCurrentPlayerTurn = computed(() => {
  const currentPlayerId = hasenStore.currentPlayerId
  return currentPlayerId ? isPlayerTurn.value(currentPlayerId) : false
})

const bidCardClasses = computed(() => {
  const baseClasses = 'rounded-xl p-2 shadow-lg max-h-16 min-w-55 transition-all duration-150 relative'
  const stateClasses = props.disabled 
    ? 'bg-hasen-base cursor-not-allowed' 
    : 'cursor-pointer bg-hasen-light hover:shadow-xl hover:scale-[1.02] active:scale-100 bid-clickable'
  
  return `${baseClasses} ${stateClasses}`
})

const bidCardStyle = computed(() => {
  if (!currentPlayerBidColor.value) return {}
  
  return {
    boxShadow: `inset 0 0 0 3px ${currentPlayerBidColor.value}`,
    animation: isCurrentPlayerTurn.value ? 'subtleGlow 3s ease-in-out infinite' : 'none'
  }
})

const isCurrentPlayerBid = computed(() => {
  const currentPlayerId = hasenStore.currentPlayerId
  return currentPlayerId ? bidders.value.includes(currentPlayerId) : false
})

const tooltip = computed(() => {
  if (!props.bid) return null
  
  // Si el jugador ya seleccionó este bid, siempre mostrar tooltip informativo verde
  if (isCurrentPlayerBid.value) {
    return getTooltip(props.bid, false, undefined)
  }
  
  // Si no, usar la lógica normal (error si está disabled, info si no)
  return getTooltip(props.bid, props.disabled || false, props.disabledReason)
})

const tooltipClasses = computed(() => {
  if (!tooltip.value) return ''
  
  const baseClasses = 'absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50'
  const colorClass = tooltip.value.type === 'error' ? 'bg-hasen-red' : 'bg-hasen-green'
  
  return `${baseClasses} ${colorClass}`
})

const tooltipArrowClasses = computed(() => {
  if (!tooltip.value) return ''
  
  const baseClasses = 'absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent'
  const colorClass = tooltip.value.type === 'error' ? 'border-t-hasen-red' : 'border-t-hasen-green'
  
  return `${baseClasses} ${colorClass}`
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
  <div v-if="bid" class="flex flex-row items-center gap-2 relative group">    
    <!-- Bid card -->
    <div 
      :class="bidCardClasses"
      :style="bidCardStyle"
      @click="handleBidClick"
    >
      <div class="flex flex-row items-stretch">
        <BidScore :score="bid.bid_score" :bidders="bidders" />
        <div class="w-[80%] flex flex-row items-center justify-center gap-2 min-w-0">
          <WinCondition :type="bid?.bid_type" :win_condition="bid?.win_condition" />
        </div>
      </div>
    </div>
    
    <!-- Tooltip informativo o de error -->
    <div 
      v-if="tooltip"
      :class="tooltipClasses"
    >
      {{ tooltip.text }}
      <div :class="tooltipArrowClasses"></div>
    </div>
  </div>
</template>

<style scoped>
@keyframes subtleGlow {
  0%, 100% {
    transform: scale(1);
    opacity: 0.6;
    filter: brightness(1);
  }
  50% {
    transform: scale(1.02);
    opacity: 0.8;
    filter: brightness(1.3);
  }
}
</style>

