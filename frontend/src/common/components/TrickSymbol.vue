<script setup lang="ts">
import TrickSymbol from '@/assets/symbols/trick.svg'

const props = withDefaults(defineProps<{
    state?: 'win' | 'lose' | 'neutral' | 'blank'
    size?: 'small' | 'large'
    char?: number | string
}>(), {
    size: 'small',
    state: 'blank',
    char: undefined
})

</script>

<template>
    <div 
        :class="['relative flex-none inline-block ' + (size === 'small' ? 'h-9 w-6' : 'h-11 w-8')]">
        <span v-if="char !== undefined && char !== null" 
            :class="'absolute pt-1 z-10 text-hasen-dark ' + (size === 'small' ? 'inset-0 left-1 text-xl' : 'top-1 left-2 text-2xl')">
            {{ char }}
        </span>
        <img
        :class="'absolute inset-0 ' + (size === 'small' ? 'h-9 w-6' : 'h-11 w-8')"
        :src="TrickSymbol"
        alt="trick symbol"
        />
        <div v-if="state === 'lose'" class="absolute inset-0 bg-hasen-red opacity-50 pointer-events-none"></div>
        <div v-if="state === 'win'" class="absolute inset-0 bg-hasen-green opacity-60 pointer-events-none"></div>
        <div v-if="state === 'neutral'" class="absolute inset-0 pointer-events-none" style="background: linear-gradient(to bottom right, rgba(47, 99, 16, 0.6) 50%, rgba(155, 44, 0, 0.5) 50%);"></div>
    </div>
</template>
