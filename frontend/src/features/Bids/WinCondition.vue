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
                    <img
                    :src="getSymbol(props.win_condition.win_suit)"
                    alt="symbol collect"
                    class="h-8"
                    />
                    <span class="text-hasen-green text-md pt-1">10</span>
                </div>

                <div class="flex flex-row">
                    <div class="relative flex flex-row w-10 flex-none pl-2">
                        <img
                        class="absolute inset-0 h-8 w-8 object-contain"
                        :src="getSymbol(props.win_condition.avoid_suit)"
                        alt="symbol avoid"
                        />
                        <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <line x1="0" y1="0" x2="100" y2="100" 
                                stroke="red" stroke-width="3" vector-effect="non-scaling-stroke" />
                        </svg>
                    </div>
                    <span class="text-hasen-red text-md pt-1">-10</span>
                </div>
            </div> 
    </div>

    <!-- TRICK -->
    <div v-if="props.type === 'trick'" class="flex flex-row px-1 gap-1">
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
