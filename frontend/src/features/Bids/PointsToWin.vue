<script setup lang="ts">
import WinSymbol from '@/assets/symbols/win-symbol.png'

defineProps<{
  points: number
}>()
</script>

<template>
  <div class="relative inline-flex items-center justify-center px-2">
    <img
      :src="WinSymbol"
      alt="Win Symbol"
      class="w-28"
    />

    <span
      class="absolute inset-0 text-black flex items-center justify-center font-semibold text-lg pointer-events-none pb-2"
    >
      {{ points }}
    </span>
  </div>
</template>

