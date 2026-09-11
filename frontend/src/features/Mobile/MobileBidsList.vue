<script setup lang="ts">
import { computed } from 'vue'
import type { Bid, BidType } from '@domain/interfaces/Bid'
import { useGameStore } from '@/stores/gameStore'
import { useHasenStore } from '@/stores/hasenStore'
import { useBidValidation } from '@/features/Bids/composables/useBidValidation'
import { useBidTooltips } from '@/common/composables/useBidTooltips'
import BidCard from '@/features/Bids/Bid.vue'

const emit = defineEmits<{
  toast: [message: string]
}>()

const gameStore = useGameStore()
const hasenStore = useHasenStore()

const game = computed(() => gameStore.publicGameState)
const playerId = computed(() => hasenStore.currentPlayerId || null)

const { isBidDisabled, getBidDisabledReason } = useBidValidation(game, playerId)
const { getBidDescription, getErrorTooltip } = useBidTooltips()

interface Entry {
  bid: Bid
  type: BidType
  disabled: boolean
  disabledReason?: string
  description: string
}

// Mismo orden que AvailableBids desktop: trick → points → set_collection
const entries = computed<Entry[]>(() => {
  const allBids = gameStore.publicGameState?.round.roundBids.bids || []

  const ordered: Array<{ bid: Bid; type: BidType }> = [
    ...allBids.filter((b) => b.bid_type === 'trick').map((bid) => ({ bid, type: 'trick' as const })),
    ...allBids.filter((b) => b.bid_type === 'points').map((bid) => ({ bid, type: 'points' as const })),
    ...allBids
      .filter((b) => b.bid_type === 'set_collection')
      .map((bid) => ({ bid, type: 'set_collection' as const })),
  ]

  return ordered.map(({ bid, type }) => ({
    bid,
    type,
    disabled: isBidDisabled.value(type, bid),
    disabledReason: getBidDisabledReason.value(type, bid),
    description: getBidDescription(bid),
  }))
})

// Tap en bid deshabilitada → toast con la razón (reemplaza al tooltip hover)
const interceptDisabled = (entry: Entry, event: MouseEvent) => {
  if (!entry.disabled) return
  event.stopPropagation()
  event.preventDefault()
  emit('toast', getErrorTooltip(entry.disabledReason)?.text || entry.description)
}
</script>

<template>
  <div class="grid grid-cols-1 min-[560px]:grid-cols-2 gap-2 px-3 pb-3">
    <div
      v-for="entry in entries"
      :key="entry.bid.bid_id"
      class="flex flex-col gap-1"
      @click.capture="interceptDisabled(entry, $event)"
    >
      <BidCard
        :bid="entry.bid"
        :type="entry.type"
        :disabled="entry.disabled"
        :disabled-reason="entry.disabledReason"
        block
      />
      <p class="text-[11px] leading-4 text-hasen-dark/70 px-1">
        {{ entry.description }}
      </p>
    </div>
  </div>
</template>
