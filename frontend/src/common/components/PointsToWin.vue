<script setup lang="ts">
import WinSymbol from '@/assets/symbols/win-symbol.png'

defineProps<{
  size?: 'small' | 'medium'
  points: number
}>()
</script>

<template>
  <div :class="['relative', 'inline-flex', 'items-center', 'justify-center', size === 'small' ? 'px-0' : 'px-2']">
    <img
      :src="WinSymbol"
      alt="Win Symbol"
      :class="size === 'small' ? 'w-8' : 'w-12 h-9'"
    />

    <span
      class="absolute inset-0 text-hasen-dark flex items-center justify-center font-semibold text-lg pointer-events-none pb-2"
    >
      {{ points }}
    </span>
  </div>
</template>

