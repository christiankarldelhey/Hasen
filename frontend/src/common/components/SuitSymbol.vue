<script setup lang="ts">
import AcornSymbol from '@/assets/symbols/acorn.png'
import BerrySymbol from '@/assets/symbols/berry.png'
import LeaveSymbol from '@/assets/symbols/leave.png'

const props = withDefaults(defineProps<{
  suit: string
  avoid?: boolean
  size?: 'small' | 'medium' | 'large'
}>(), {
  avoid: false,
  size: 'large'
})

const sizeClasses = {
  small: 'h-5 w-5',
  medium: 'h-8 w-8',
  large: 'h-8 w-8'
}

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
    <!-- Version with avoid (crossed out) -->
    <div v-if="props.avoid" :class="['relative flex-shrink-0', sizeClasses[props.size]]">
        <img
            :class="['object-contain', sizeClasses[props.size]]"
            :src="getSymbol(props.suit)"
            alt="symbol avoid"
        />
        <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="0" y1="0" x2="100" y2="100" 
                stroke="#dc2626" stroke-width="5" />
        </svg>
    </div>

    <!-- Default version -->
    <img
        v-else
        :src="getSymbol(props.suit)"
        alt="symbol collect"
        :class="['object-contain', sizeClasses[props.size]]"
    />
</template>
