<script setup lang="ts">
import TrickSymbol from '@/assets/symbols/trick.svg'

defineProps<{
    avoid?: boolean
    char?: number | string
}>()

</script>

<template>
    <div class="relative h-9 w-6 flex-none inline-block">
        <span v-if="char !== undefined && char !== null" 
            :class="['absolute inset-0 left-1 text-2xl pt-1 font-semibold z-10', avoid ? 'text-hasen-dark' : 'text-hasen-green']">
            {{ char }}
        </span>
        <img
        class="absolute inset-0 h-9 w-6"
        :src="TrickSymbol"
        alt="trick symbol"
        />
        <template v-if="avoid">
            <svg class="absolute top-3 left-1 h-4 w-4 pointer-events-none">
                <line x1="100%" y1="100%" x2="0" y2="0" 
                    stroke="red" stroke-width="3" />
            </svg>
            <svg class="absolute top-3 left-1 h-4 w-4 pointer-events-none">
                <line x1="0" y1="100%" x2="100%" y2="0" 
                    stroke="red" stroke-width="3" />
            </svg>
        </template>
    </div>
</template>
