<script setup lang="ts">
import { computed } from 'vue'
import type { Bid, PlayerId, SetCollectionBidCondition, Suit } from '@domain/interfaces'
import { useGameStore } from '@/stores/gameStore'
import WinPointsSymbol from '@/assets/symbols/win-symbol.png'
import TrickWinSymbol from '@/assets/symbols/crown.svg'
import AcornSymbol from '@/assets/symbols/acorn.png'
import BerrySymbol from '@/assets/symbols/berry.png'
import LeaveSymbol from '@/assets/symbols/leave.png'
import FlowerSymbol from '@/assets/symbols/flower.png'

interface Props {
  playerId: PlayerId
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium'
})

const gameStore = useGameStore()

const sizeClasses = {
  small: 'px-2 py-0.5',
  medium: 'px-2.5 py-1',
  large: 'px-3 py-1.5'
}

const iconSizes = {
  small: 'w-2 h-2',
  medium: 'w-3 h-3',
  large: 'w-4 h-4'
}

const emptyTextSizes = {
  small: 'text-[9px]',
  medium: 'text-[10px]',
  large: 'text-xs'
}

interface BidSymbol {
  key: string
  src: string
  alt: string
}

function getSuitSymbol(suit: Suit): { src: string; alt: string } {
  switch (suit) {
    case 'acorns':
      return { src: AcornSymbol, alt: 'Acorn bid' }
    case 'berries':
      return { src: BerrySymbol, alt: 'Berry bid' }
    case 'leaves':
      return { src: LeaveSymbol, alt: 'Leave bid' }
    case 'flowers':
      return { src: FlowerSymbol, alt: 'Flower bid' }
    default:
      return { src: AcornSymbol, alt: 'Set collection bid' }
  }
}

const playerBidEntries = computed(() => {
  return gameStore.publicGameState?.round.roundBids.playerBids?.[props.playerId] ?? []
})

const allBids = computed(() => {
  return gameStore.publicGameState?.round.roundBids.bids ?? []
})

function getBidById(bidId: string): Bid | undefined {
  return allBids.value.find((bid) => bid.bid_id === bidId)
}

const bidSymbols = computed<BidSymbol[]>(() => {
  return playerBidEntries.value.flatMap((entry, index) => {
    const bid = getBidById(entry.bidId)
    if (!bid) return []

    if (bid.bid_type === 'points') {
      return [{ key: `${entry.bidId}-${index}`, src: WinPointsSymbol, alt: 'Points bid' }]
    }

    if (bid.bid_type === 'trick') {
      return [{ key: `${entry.bidId}-${index}`, src: TrickWinSymbol, alt: 'Trick bid' }]
    }

    const condition = bid.win_condition as SetCollectionBidCondition
    const suitSymbol = getSuitSymbol(condition.win_suit)

    return [{ key: `${entry.bidId}-${index}`, src: suitSymbol.src, alt: suitSymbol.alt }]
  })
})

const hasBids = computed(() => bidSymbols.value.length > 0)
</script>

<template>
  <div
    :class="[
      'bg-hasen-base rounded-full inline-flex w-max items-center gap-1 border border-hasen-dark whitespace-nowrap box-border shrink-0',
      sizeClasses[size]
    ]"
    style="width: max-content"
  >
    <span
      v-if="!hasBids"
      :class="['text-hasen-dark italic leading-none', emptyTextSizes[size]]"
    >
      No Bids
    </span>

    <div v-else class="inline-flex items-center gap-1">
      <img
        v-for="symbol in bidSymbols"
        :key="symbol.key"
        :src="symbol.src"
        :alt="symbol.alt"
        :class="['block', iconSizes[size]]"
      />
    </div>
  </div>
</template>
