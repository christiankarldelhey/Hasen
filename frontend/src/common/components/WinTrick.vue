<script setup lang="ts">
import TrickSymbol from '@/assets/symbols/trick.png'

defineProps<{
    tricks: number | number[]
}>()

</script>

<template>
    <div v-for="trick in tricks" :key="trick" class="relative h-9 w-6 flex-none inline-block">
        <span v-if="typeof trick === 'number'" 
            class="absolute inset-0 left-1 text-hasen-green text-2xl pt-1 font-semibold z-10">
            {{ trick }}
        </span>
        <img
        class="absolute inset-0 h-9 w-6"
        :src="TrickSymbol"
        alt="trick symbol"
        />
    </div>
</template>