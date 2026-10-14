<script setup lang="ts">
import { computed } from 'vue'
import type { BidType, TrickBidCondition, PointsBidCondition, SetCollectionBidCondition } from '@domain/interfaces/Bid'
import { POINTS_BID_OPEN_MAX } from '@domain/data/bidDefinitions'
import TrickSymbol from '@/common/components/TrickSymbol.vue'
import SuitSymbol from '@/common/components/SuitSymbol.vue'
import PointsToWin from '@/common/components/PointsToWin.vue'

const props = defineProps<{
  type: BidType
  win_condition: TrickBidCondition | PointsBidCondition | SetCollectionBidCondition
  winSuitCount?: number
  otherSuitCount?: number
  bidScore?: number
  otherSuitPenalty?: number
}>()

const trickCondition = computed(() =>
  props.type === 'trick' ? props.win_condition as TrickBidCondition : null
)

const pointsCondition = computed(() =>
  props.type === 'points' ? props.win_condition as PointsBidCondition : null
)

const setCondition = computed(() =>
  props.type === 'set_collection' ? props.win_condition as SetCollectionBidCondition : null
)

// Bazas exactas sin importar el orden: "N ×" pila verde (ganar) + "M ×" pila roja (perder)
const exactTrickStacks = computed(() => {
  const condition = trickCondition.value
  if (!condition || condition.win_min_tricks === undefined || condition.win_min_tricks !== condition.win_max_tricks) return null
  return [
    { count: condition.win_min_tricks, state: 'win' as const },
    { count: 5 - condition.win_min_tricks, state: 'lose' as const }
  ].filter(stack => stack.count > 0)
})

// Bazas por posición: las 5 numeradas (verde ganar, rojo perder, mixto da igual)
const trickPositions = computed(() => {
  const condition = trickCondition.value
  if (!condition) return []
  return ([1, 2, 3, 4, 5] as const).map(num => ({
    num,
    state: condition.win_trick_position?.includes(num) ? 'win' as const
      : condition.lose_trick_position?.includes(num) ? 'lose' as const
      : 'neutral' as const
  }))
})

const isOpenPointsBid = computed(() =>
  pointsCondition.value?.max_points === POINTS_BID_OPEN_MAX
)

const collectionCardValue = computed(() => props.bidScore ?? 15)
</script>

<template>
  <div class="flex items-center">
    <!-- Trick bid: exact count -->
    <div v-if="type === 'trick' && exactTrickStacks" class="flex items-center gap-3">
      <div v-for="stack in exactTrickStacks" :key="stack.state" class="flex items-center gap-1">
        <span class="text-hasen-dark text-xl whitespace-nowrap">{{ stack.count }} ×</span>
        <div class="flex items-center">
          <TrickSymbol
            v-for="i in stack.count"
            :key="i"
            :state="stack.state"
            size="small"
            :class="i > 1 ? '-ml-4' : ''"
          />
        </div>
      </div>
    </div>

    <!-- Trick bid: positions -->
    <div v-else-if="type === 'trick'" class="flex items-center gap-1">
      <TrickSymbol
        v-for="trick in trickPositions"
        :key="trick.num"
        :char="trick.num"
        :state="trick.state"
        size="small"
      />
    </div>

    <!-- Points bid: show min-max or min+ -->
    <div v-else-if="type === 'points' && pointsCondition" class="flex flex-row gap-3 px-1">
      <PointsToWin :points="pointsCondition.min_points" />
      <span class="text-hasen-dark text-2xl font-semibold pt-1">{{ isOpenPointsBid ? '+' : '-' }}</span>
      <PointsToWin v-if="!isOpenPointsBid" :points="pointsCondition.max_points" />
    </div>

    <!-- Collection bid: target suit, penalty for other suits and floor -->
    <div v-else-if="type === 'set_collection' && setCondition" class="flex items-center gap-1">
      <SuitSymbol :suit="setCondition.win_suit" />
      <span class="text-hasen-green text-md font-semibold whitespace-nowrap">
        {{ winSuitCount ?? `×${collectionCardValue}` }}
      </span>
      <SuitSymbol suit="avoidOtherSuits" :except-suit="setCondition.win_suit" avoid class="ml-1" />
      <span class="text-hasen-red text-md font-semibold whitespace-nowrap">
        {{ otherSuitCount ?? (otherSuitPenalty ? `-${otherSuitPenalty}` : '-2/4/6') }}
      </span>
      <span class="ml-1 text-xs font-bold text-hasen-dark whitespace-nowrap">≥ {{ setCondition.floor }}</span>
    </div>
  </div>
</template>
