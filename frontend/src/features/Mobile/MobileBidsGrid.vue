<script setup lang="ts">
import { computed } from 'vue'
import type { Bid, BidType } from '@domain/interfaces/Bid'
import type { PlayerId } from '@domain/interfaces/Player'
import { useGameStore } from '@/stores/gameStore'
import { useHasenStore } from '@/stores/hasenStore'
import { useSocketGame } from '@/common/composables/useSocketGame'
import { useBidValidation } from '@/features/Bids/composables/useBidValidation'
import { useBidTooltips } from '@/common/composables/useBidTooltips'
import { IconCheck } from '@tabler/icons-vue'

const emit = defineEmits<{
  toast: [message: string]
}>()

const gameStore = useGameStore()
const hasenStore = useHasenStore()
const socketGame = useSocketGame()

const game = computed(() => gameStore.publicGameState)
const playerId = computed(() => hasenStore.currentPlayerId || null)

const { isBidDisabled, getBidDisabledReason } = useBidValidation(game, playerId)
const { getBidDescription, getErrorTooltip } = useBidTooltips()

interface Tile {
  bid: Bid
  type: BidType
  mine: boolean
  disabled: boolean
  disabledReason?: string
  description: string
  bidders: PlayerId[]
}

const tiles = computed<Tile[]>(() => {
  const allBids = gameStore.publicGameState?.round.roundBids.bids || []
  const playerBids = gameStore.publicGameState?.round.roundBids.playerBids || {}

  const ordered: Array<{ bid: Bid; type: BidType }> = [
    ...allBids.filter((b) => b.bid_type === 'trick').map((bid) => ({ bid, type: 'trick' as const })),
    ...allBids.filter((b) => b.bid_type === 'points').map((bid) => ({ bid, type: 'points' as const })),
    ...allBids
      .filter((b) => b.bid_type === 'set_collection')
      .map((bid) => ({ bid, type: 'set_collection' as const })),
  ]

  return ordered.map(({ bid, type }) => {
    const bidders = Object.entries(playerBids)
      .filter(([, entries]) => entries.some((e) => e.bidId === bid.bid_id))
      .map(([pid]) => pid as PlayerId)

    const disabled = isBidDisabled.value(type, bid)

    return {
      bid,
      type,
      mine: playerId.value ? bidders.includes(playerId.value) : false,
      disabled,
      disabledReason: getBidDisabledReason.value(type, bid),
      description: getBidDescription(bid),
      bidders,
    }
  })
})

const tileStyle = (tile: Tile) => {
  if (tile.mine) {
    return { boxShadow: 'inset 0 0 0 2px #2f6310' }
  }
  if (tile.bidders.length === 1) {
    const player = gameStore.publicGameState?.activePlayers.find(
      (p) => p.id === tile.bidders[0]
    )
    if (player) return { boxShadow: `inset 0 0 0 2px ${player.color}` }
  }
  return {}
}

const handleTap = (tile: Tile) => {
  if (tile.mine) return
  if (tile.disabled) {
    emit('toast', getErrorTooltip(tile.disabledReason)?.text || tile.description)
    return
  }

  const gameId = gameStore.publicGameState?.gameId
  const trickNumber = gameStore.publicGameState?.round.currentTrick?.trick_number
  if (!gameId || !trickNumber) return

  socketGame.makeBid(gameId, tile.type, trickNumber, tile.bid.bid_id)
}
</script>

<template>
  <div class="grid grid-cols-2 gap-2 px-3 pb-3">
    <button
      v-for="tile in tiles"
      :key="tile.bid.bid_id"
      type="button"
      :class="[
        'relative flex items-center gap-2 min-h-[72px] rounded-lg border p-2 text-left transition-colors',
        tile.mine
          ? 'bg-hasen-light border-hasen-green'
          : tile.disabled
            ? 'bg-hasen-base/60 border-hasen-dark/20 opacity-50'
            : 'bg-hasen-light border-hasen-dark/30 active:bg-hasen-base',
      ]"
      :style="tileStyle(tile)"
      @click="handleTap(tile)"
    >
      <!-- Score circle (colored by bidders) -->
      <div
        class="w-9 h-9 rounded-full border border-hasen-dark flex items-center justify-center shrink-0"
        :style="{
          backgroundColor:
            tile.bidders.length === 0
              ? '#e2d2a8'
              : gameStore.publicGameState?.activePlayers.find((p) => p.id === tile.bidders[0])
                  ?.color || '#e2d2a8',
        }"
      >
        <span class="text-base font-semibold text-hasen-dark tabular-nums">
          {{ tile.bid.bid_score }}
        </span>
      </div>

      <span class="text-[11px] leading-4 text-hasen-dark">{{ tile.description }}</span>

      <IconCheck
        v-if="tile.mine"
        :size="16"
        class="absolute top-1 right-1 text-hasen-green"
      />
    </button>
  </div>
</template>
