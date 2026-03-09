<script setup lang="ts">
import type { HighlightRect } from '../core/tutorialTypes'
import TutorialNotification from './TutorialNotification.vue'

interface Props {
  title: string
  description: string
  stepIndex: number
  totalSteps: number
  rect: HighlightRect | null
  rects?: HighlightRect[]
  isFirstStep: boolean
  isLastStep: boolean
  canGoNext?: boolean
  nextLabel?: string
}

withDefaults(defineProps<Props>(), {
  canGoNext: true,
  nextLabel: '',
  rects: () => []
})

defineEmits<{
  next: []
  previous: []
  restart: []
}>()
</script>

<template>
  <div class="pointer-events-none fixed inset-0 z-50">
    <template v-if="rects.length > 0">
      <div
        v-for="(item, index) in rects"
        :key="`highlight-${index}`"
        class="absolute rounded-xl border-2 border-amber-300"
        :style="{
          top: `${item.top - 8}px`,
          left: `${item.left - 8}px`,
          width: `${item.width + 16}px`,
          height: `${item.height + 16}px`
        }"
      />
    </template>

    <div
      v-else-if="rect"
      class="absolute rounded-xl border-2 border-amber-300"
      :style="{
        top: `${rect.top - 8}px`,
        left: `${rect.left - 8}px`,
        width: `${rect.width + 16}px`,
        height: `${rect.height + 16}px`
      }"
    />

    <TutorialNotification
      :title="title"
      :description="description"
      :step-index="stepIndex"
      :total-steps="totalSteps"
      :is-first-step="isFirstStep"
      :is-last-step="isLastStep"
      :can-go-next="canGoNext"
      :next-label="nextLabel"
      @next="$emit('next')"
      @previous="$emit('previous')"
      @restart="$emit('restart')"
    />
  </div>
</template>
