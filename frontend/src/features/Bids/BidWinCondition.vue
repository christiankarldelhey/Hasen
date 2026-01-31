<script setup lang="ts">
import { computed } from 'vue'
import type { BidType, PointsBidCondition, SetCollectionBidCondition, TrickBidCondition } from '@domain/interfaces/Bid'
import TrickSymbol from '@/common/components/TrickSymbol.vue'
import PointsToWin from '@/common/components/PointsToWin.vue'
import SuitSymbol from '@/common/components/SuitSymbol.vue'

const props = defineProps<{
  type: BidType
  win_condition: PointsBidCondition | SetCollectionBidCondition | TrickBidCondition
}>()

const pointsCondition = computed(() => props.win_condition as PointsBidCondition)
const setCondition = computed(() => props.win_condition as SetCollectionBidCondition)
const trickCondition = computed(() => props.win_condition as TrickBidCondition)

const sortedTricks = computed(() => {
  if (props.type !== 'trick') return []
  
  const tricks: Array<{ position: number, state: 'win' | 'lose' | 'neutral' }> = []
  const condition = trickCondition.value
  
  condition.lose_trick_position?.forEach(pos => {
    tricks.push({ position: pos, state: 'lose' })
  })
  
  condition.win_trick_position?.forEach(pos => {
    tricks.push({ position: pos, state: 'win' })
  })
  
  condition.may_win_trick_position?.forEach(pos => {
    tricks.push({ position: pos, state: 'neutral' })
  })
  
  return tricks.sort((a, b) => a.position - b.position)
})

</script>
<template>
    <!-- POINTS -->
    <div v-if="props.type === 'points'" class="flex flex-row px-1">
        <PointsToWin :points="pointsCondition.min_points" />
        <span class="text-hasen-dark text-2xl font-semibold pt-1">  -  </span>  
        <PointsToWin :points="pointsCondition.max_points" />
    </div>

    <!-- SET COLLECTION -->
    <div v-if="props.type === 'set_collection'" 
        class="px-1">
            <div class="flex flex-row justify-center">
                <div class="flex flex-row pr-2">
                    <SuitSymbol :suit="setCondition.win_suit" />
                    <span class="text-hasen-green text-md pt-1">10</span>
                </div>

                <div class="flex flex-row">
                    <SuitSymbol :suit="setCondition.avoid_suit" :avoid="true" />
                    <span class="text-hasen-red text-md pt-1">-10</span>
                </div>
            </div> 
    </div>

    <!-- TRICK -->
    <div v-if="props.type === 'trick'" class="flex flex-row px-1 gap-1">
        <TrickSymbol 
            v-for="trick in sortedTricks" 
            :key="trick.position"
            :state="trick.state" 
            :char="trick.position" 
        />
        <!-- Ganar determinado truco -->
        <template v-if="trickCondition.win_min_tricks && trickCondition.win_max_tricks && trickCondition.win_min_tricks < trickCondition.win_max_tricks">
            <TrickSymbol state="win" v-for="_num in trickCondition.win_min_tricks" />
        </template>
        <template v-if="trickCondition?.win_max_tricks && trickCondition?.win_min_tricks === trickCondition?.win_max_tricks">
            <TrickSymbol v-for="(_, i) in trickCondition.win_max_tricks" state="win" :key="i" />
            <TrickSymbol v-for="(_, i) in (5 - trickCondition.win_max_tricks)" state="lose" :key="i" />
        </template>
    </div>
</template>
