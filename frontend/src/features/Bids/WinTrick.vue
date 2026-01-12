<script setup lang="ts">
import TrickSymbol from '@/assets/symbols/trick.png'
import CrownSymbol from '@/assets/symbols/crown.svg'

defineProps<{
    tricks: number
}>()

</script>

<template>
    <div v-for="trick in tricks" :key="trick" class="relative h-9 w-6 flex-none inline-block">
        <img
        class="absolute inset-0 h-9 w-6"
        :src="TrickSymbol"
        alt="trick symbol"
        />
        <img
        class="absolute inset-0 h-9 w-6 top-[-25px]"
        :src="CrownSymbol"
        alt="crown symbol"
        />
    </div>
</template>