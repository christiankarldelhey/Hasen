<script setup lang="ts">
import type { HighlightRect } from '../core/tutorialTypes'

defineProps<{
  rects: HighlightRect[]
  /** Pulse the frame to draw attention (action steps). */
  pulse?: boolean
}>()
</script>

<template>
  <div class="pointer-events-none fixed inset-0 z-50">
    <div
      v-for="(item, index) in rects"
      :key="`highlight-${index}`"
      :class="['absolute rounded-xl border-2 border-amber-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]', pulse ? 'animate-pulse' : '']"
      :style="{
        top: `${item.top - 8}px`,
        left: `${item.left - 8}px`,
        width: `${item.width + 16}px`,
        height: `${item.height + 16}px`
      }"
    />
  </div>
</template>
