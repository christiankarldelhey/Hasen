<script setup lang="ts">
import type { BidType, PointsBidCondition, SetCollectionBidCondition, TrickBidCondition } from '@domain/interfaces/Bid'
import AcornSymbol from '@/assets/symbols/acorn.png'
import BerrySymbol from '@/assets/symbols/berry.png'
import LeaveSymbol from '@/assets/symbols/leave.png'
import WinTrick from './WinTrick.vue'
import LoseTrick from './LoseTrick.vue'
import PointsToWin from './PointsToWin.vue'

const props = defineProps<{
  type: BidType
  win_condition: PointsBidCondition | SetCollectionBidCondition | TrickBidCondition
}>()

function getSymbol(collect: string) {
    switch (collect) {
    case 'acorns':
        return AcornSymbol
    case 'berries':
        return BerrySymbol
    case 'leaves':
        return LeaveSymbol    
    default:
        return 'acorns'
}
}

</script>
<template>
    <!-- POINTS -->
    <div v-if="props.type === 'points'" class="flex flex-row px-2">
        <PointsToWin :points="props.win_condition.min_points" />
        <span class="text-hasen-dark text-2xl font-semibold pt-1">  -  </span>  
        <PointsToWin :points="props.win_condition.max_points" />
    </div>

    <!-- SET COLLECTION -->
    <div v-if="props.type === 'set_collection'" class="flex flex-row px-2">
        <div class="flex flex-row pl-0 pr-1">
            <span class="text-hasen-dark text-xl pt-2 font-semibold">X</span>
            <img
            :src="getSymbol(props.win_condition.win_suit)"
            alt="symbol collect"
            class="px-2 h-8"
            />

            <div class="relative h-8 w-12 flex-none inline-block">
                <img
                class="absolute inset-0 left-2 h-8"
                :src="getSymbol(props.win_condition.avoid_suit)"
                alt="symbol avoid"
                />
                <svg class="absolute inset-0 w-full h-full pointer-events-none">
                    <line x1="100%" y1="100%" x2="0" y2="0" 
                        stroke="red" stroke-width="3" />
                </svg>
            </div>
        </div> 
    </div>

    <!-- TRICK -->
    <div v-if="props.type === 'trick'" class="flex flex-row px-2 gap-0">
        <template v-if="props.win_condition?.lose_trick_position">
            <LoseTrick :tricks="props.win_condition.lose_trick_position" />
        </template>
        <template v-if="props.win_condition?.win_trick_position">
            <WinTrick :tricks="props.win_condition.win_trick_position" />
        </template>
        <!-- Ganar determinado truco -->
        <template v-if="props.win_condition.win_min_tricks && props.win_condition.win_min_tricks < props.win_condition.win_max_tricks">
            <WinTrick :tricks="props.win_condition.win_min_tricks"  />
        </template>
        <template v-if="props.win_condition?.win_max_tricks && props.win_condition?.win_min_tricks === props.win_condition?.win_max_tricks">
            <WinTrick :tricks="props.win_condition.win_min_tricks"  />
            <LoseTrick :tricks="1"  />
        </template>
    </div>
</template>
