<script setup lang="ts">
import AcornSymbol from '@/assets/symbols/acorn.png'
import BerrySymbol from '@/assets/symbols/berry.png'
import FlowerSymbol from '@/assets/symbols/flower.png'
import LeaveSymbol from '@/assets/symbols/leave.png'

type SuitSymbolKey = 'acorns' | 'berries' | 'leaves' | 'flowers' | 'avoidOtherSuits'

const props = withDefaults(defineProps<{
  suit: SuitSymbolKey
  avoid?: boolean
  size?: 'small' | 'medium' | 'large'
  value?: number | string
}>(), {
  avoid: false,
  size: 'large',
  value: undefined
})

const sizeClasses = {
  small: 'h-5 w-5',
  medium: 'h-8 w-8',
  large: 'h-8 w-8'
}

function getSymbol(collect: SuitSymbolKey) {
    switch (collect) {
    case 'acorns':
        return AcornSymbol
    case 'berries':
        return BerrySymbol
    case 'leaves':
        return LeaveSymbol
    case 'flowers':
        return FlowerSymbol
    default:
        return AcornSymbol
    }
}
</script>

<template>
    <div v-if="props.suit === 'avoidOtherSuits'" :class="['relative flex-shrink-0 mx-1', sizeClasses[props.size]]">
        <img
            :src="AcornSymbol"
            alt="avoid acorns"
            :class="['object-contain absolute left-0 top-0', sizeClasses[props.size]]"
            style="transform: translate(-10%, 10%);"
        />
        <img
            :src="BerrySymbol"
            alt="avoid berries"
            :class="['object-contain absolute left-0 top-0', sizeClasses[props.size]]"
            style="transform: translate(12%, -8%);"
        />
        <img
            :src="LeaveSymbol"
            alt="avoid leaves"
            :class="['object-contain absolute left-0 top-0', sizeClasses[props.size]]"
            style="transform: translate(2%, 2%);"
        />

        <svg v-if="props.avoid" class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="0" y1="0" x2="100" y2="100"
                stroke="#dc2626" stroke-width="5" />
        </svg>

        <div
            v-if="props.value !== undefined"
            class="absolute inset-x-0 top-4 flex items-end justify-center pointer-events-none"
        >
            <span class="bg-hasen-base rounded-full px-2 py-1 text-hasen-dark font-bold text-xs shadow-md border border-hasen-dark">
                {{ props.value }}
            </span>
        </div>
    </div>

    <!-- Version with avoid (crossed out) -->
    <div v-else-if="props.avoid" :class="['relative flex-shrink-0 mx-1', sizeClasses[props.size]]">
        <img
            :class="['object-contain', sizeClasses[props.size]]"
            :src="getSymbol(props.suit)"
            alt="symbol avoid"
        />
        <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="0" y1="0" x2="100" y2="100" 
                stroke="#dc2626" stroke-width="5" />
        </svg>
        
        <!-- Value badge for avoid version -->
        <div 
            v-if="props.value !== undefined"
            class="absolute inset-x-0 top-4 flex items-end justify-center pointer-events-none"
        >
            <span class="bg-hasen-base rounded-full px-2 py-1 text-hasen-dark font-bold text-xs shadow-md border border-hasen-dark">
                {{ props.value }}
            </span>
        </div>
    </div>

    <!-- Default version with optional value -->
    <div v-else :class="['relative flex-shrink-0 mx-1', sizeClasses[props.size]]">
        <img
            :src="getSymbol(props.suit)"
            alt="symbol collect"
            :class="['object-contain', sizeClasses[props.size]]"
        />
        
        <!-- Value badge -->
        <div 
            v-if="props.value !== undefined"
            class="absolute inset-x-0 top-4 flex items-end justify-center pointer-events-none "
        >
            <span class="bg-hasen-base rounded-full px-2 py-1 text-hasen-dark font-bold text-xs shadow-md border border-hasen-dark">
                {{ props.value }}
            </span>
        </div>
    </div>
</template>
