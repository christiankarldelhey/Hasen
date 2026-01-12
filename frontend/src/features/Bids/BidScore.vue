<script setup lang="ts">
import ShieldSymbol from '@/assets/symbols/shield-2.png'

defineProps<{
  score: number
}>()
</script>

<template>
  <div class="relative inline-flex items-center justify-center px-2">
    <img
      :src="ShieldSymbol"
      alt="Shield Symbol"
      class="w-10"
    />

    <span
      class="absolute inset-0 text-black flex items-center justify-center font-semibold text-xl pointer-events-none"
    >
      {{ score }}
    </span>
  </div>
</template>