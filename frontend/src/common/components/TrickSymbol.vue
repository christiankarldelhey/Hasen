<script setup lang="ts">
import TrickSymbol from '@/assets/symbols/trick.svg'

defineProps<{
    state?: 'win' | 'lose' | 'neutral' | 'blank'
    char?: number | string
}>()

</script>

<template>
    <div class="relative h-9 w-6 flex-none inline-block">
        <span v-if="char !== undefined && char !== null" 
            class="absolute inset-0 left-1 text-xl pt-1 z-10 text-hasen-dark">
            {{ char }}
        </span>
        <img
        class="absolute inset-0 h-9 w-6"
        :src="TrickSymbol"
        alt="trick symbol"
        />
        <div v-if="state === 'lose'" class="absolute inset-0 bg-hasen-red opacity-50 pointer-events-none"></div>
        <div v-if="state === 'win'" class="absolute inset-0 bg-hasen-green opacity-60 pointer-events-none"></div>
        <div v-if="state === 'neutral'" class="absolute inset-0 pointer-events-none" style="background: linear-gradient(to bottom right, rgba(47, 99, 16, 0.6) 50%, rgba(155, 44, 0, 0.5) 50%);"></div>
        <div v-if="state === 'blank'" class="absolute inset-0 bg-hasen-base pointer-events-none"></div>
    </div>
</template>
