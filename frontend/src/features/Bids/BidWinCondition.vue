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

const sortedTricks = computed(() => {
  if (props.type !== 'trick') return []
  
  const tricks: Array<{ position: number, state: 'win' | 'lose' | 'neutral' }> = []
  const condition = props.win_condition as TrickBidCondition
  
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
        <PointsToWin :points="props.win_condition.min_points" />
        <span class="text-hasen-dark text-2xl font-semibold pt-1">  -  </span>  
        <PointsToWin :points="props.win_condition.max_points" />
    </div>

    <!-- SET COLLECTION -->
    <div v-if="props.type === 'set_collection'" 
        class="px-1">
            <div class="flex flex-row justify-center">
                <div class="flex flex-row pr-2">
                    <SuitSymbol :suit="props.win_condition.win_suit" />
                    <span class="text-hasen-green text-md pt-1">10</span>
                </div>

                <div class="flex flex-row">
                    <SuitSymbol :suit="props.win_condition.avoid_suit" :avoid="true" />
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
        <template v-if="props.win_condition.win_min_tricks && props.win_condition.win_min_tricks < props.win_condition.win_max_tricks">
            <TrickSymbol state="win" v-for="num in props.win_condition.win_min_tricks" />
        </template>
        <template v-if="props.win_condition?.win_max_tricks && props.win_condition?.win_min_tricks === props.win_condition?.win_max_tricks">
            <TrickSymbol v-for="(_, i) in props.win_condition.win_max_tricks" state="win" :key="i" />
            <TrickSymbol v-for="(_, i) in (5 - props.win_condition.win_max_tricks)" state="lose" :key="i" />
        </template>
    </div>
</template>
