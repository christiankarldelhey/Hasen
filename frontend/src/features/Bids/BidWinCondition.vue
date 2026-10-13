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

const trickNumbers = computed<number[]>(() => {
  if (!trickCondition.value) return []
  return [1, 2, 3, 4, 5]
})

const getTrickState = (num: number): 'win' | 'lose' | 'neutral' | 'blank' => {
  if (!trickCondition.value) return 'blank'
  
  const condition = trickCondition.value
  
  if (condition.win_trick_position?.includes(num as 1|2|3|4|5)) return 'win'
  if (condition.lose_trick_position?.includes(num as 1|2|3|4|5)) return 'lose'
  if (condition.may_win_trick_position?.includes(num as 1|2|3|4|5)) return 'neutral'
  
  if (condition.win_min_tricks !== undefined && condition.win_max_tricks !== undefined) {
    if (condition.win_min_tricks === 0 && condition.win_max_tricks === 0) return 'lose'
    if (condition.win_min_tricks === 1 && condition.win_max_tricks === 1) return 'neutral'
    if (condition.win_min_tricks === 2 && condition.win_max_tricks === 2) return 'neutral'
    if (condition.win_min_tricks === 3 && condition.win_max_tricks === 3) return 'neutral'
    if (condition.win_min_tricks === 4 && condition.win_max_tricks === 4) return 'neutral'
    if (condition.win_min_tricks === 5 && condition.win_max_tricks === 5) return 'win'
    if (condition.win_min_tricks === 1 && condition.win_max_tricks === 3) return 'neutral'
    if (condition.win_min_tricks === 4 && condition.win_max_tricks === 5) return 'neutral'
  }
  
  return 'blank'
}

const isOpenPointsBid = computed(() =>
  pointsCondition.value?.max_points === POINTS_BID_OPEN_MAX
)

const collectionCardValue = computed(() => props.bidScore ?? 15)
</script>

<template>
  <div class="flex items-center">
    <!-- Trick bid: show 5 trick symbols -->
    <div v-if="type === 'trick'" class="flex items-center gap-0.5">
      <TrickSymbol
        v-for="num in trickNumbers"
        :key="num"
        :char="num"
        :state="getTrickState(num)"
        size="small"
      />
    </div>

    <!-- Points bid: show min-max or min+ -->
    <div v-else-if="type === 'points' && pointsCondition" class="flex items-center gap-0.5">
      <PointsToWin size="small" :points="pointsCondition.min_points" />
      <span v-if="isOpenPointsBid" class="text-hasen-dark font-bold">+</span>
      <template v-else>
        <span class="text-hasen-dark font-bold">-</span>
        <PointsToWin size="small" :points="pointsCondition.max_points" />
      </template>
    </div>

    <!-- Collection bid: target suit, penalty for other suits and floor -->
    <div v-else-if="type === 'set_collection' && setCondition" class="flex items-center gap-0.5">
      <SuitSymbol :suit="setCondition.win_suit" :value="winSuitCount ?? `×${collectionCardValue}`" />
      <SuitSymbol
        suit="avoidOtherSuits"
        :except-suit="setCondition.win_suit"
        avoid
        :value="otherSuitCount ?? '-2/4/6'"
      />
      <span class="ml-1 text-xs font-bold text-hasen-dark whitespace-nowrap">≥ {{ setCondition.floor }}</span>
    </div>
  </div>
</template>
