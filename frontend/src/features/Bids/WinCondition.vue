<script setup lang="ts">
import type { BidType, PointsBidCondition, SetCollectionBidCondition, TrickBidCondition } from '@domain/interfaces/Bid'
import AcornSymbol from '@/assets/symbols/acorn.png'
import BerrySymbol from '@/assets/symbols/berry.png'
import LeaveSymbol from '@/assets/symbols/leave.png'
import TrickSymbol from '@/assets/symbols/trick.png'
import WinTrick from './WinTrick.vue'
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
    <!-- Win condition -->
    <div v-if="props.type === 'points'" class="flex flex-row px-2">
        <PointsToWin :points="props.win_condition.min_points" />
        <span class="text-hasen-dark text-2xl font-semibold pt-1">  -  </span>  
        <PointsToWin :points="props.win_condition.max_points" />
    </div>
    <div v-if="props.type === 'set_collection'" class="flex flex-row px-2">
        <div class="flex flex-row px-2">
            <span class="text-hasen-dark text-xl pt-2 font-semibold">X</span>
            <img
            :src="getSymbol(props.win_condition.win_suit)"
            alt="symbol collect"
            class="px-2 h-12"
            />

            <div class="relative h-12 w-12 flex-none inline-block">
                <img
                class="absolute inset-0 w-full"
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
    <div v-if="props.type === 'trick'" class="flex flex-row px-2 mt-2 gap-1">
        <!-- Perder determinado truco -->
        <div class="relative h-9 w-6 flex-none inline-block">
            <img
            class="absolute inset-0 h-9 w-6 "
            :src="TrickSymbol"
            alt="trick symbol"
            />
            <svg class="absolute top-3 left-1 h-4 w-4 pointer-events-none">
                <line x1="100%" y1="100%" x2="0" y2="0" 
                    stroke="red" stroke-width="3" />
            </svg>
            <svg class="absolute top-3 left-1 h-4 w-4 pointer-events-none">
                <line x1="0" y1="100%" x2="100%" y2="0" 
                    stroke="red" stroke-width="3" />
            </svg>
        </div>
        <!-- Ganar determinado truco -->
        <template v-if="props.win_condition?.win_min_tricks">
            <WinTrick :tricks="props.win_condition.win_min_tricks"  />
        </template>
    </div>
</template>
