<script setup lang="ts">
interface Props {
  title: string
  description: string
  stepIndex: number
  totalSteps: number
  isFirstStep: boolean
  isLastStep: boolean
  canGoNext?: boolean
  nextLabel?: string
}

withDefaults(defineProps<Props>(), {
  canGoNext: true,
  nextLabel: ''
})

defineEmits<{
  next: []
  previous: []
  restart: []
}>()
</script>

<template>
  <div
    class="pointer-events-auto absolute top-44 left-1/2 z-10 w-[min(92vw,560px)] -translate-x-1/2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-slate-900 shadow-xl"
    data-testid="tutorial-notification"
  >
    <p class="text-xs font-semibold uppercase tracking-wide text-amber-700">
      Step {{ stepIndex + 1 }} / {{ totalSteps }}
    </p>
    <h2 class="mt-1 text-lg font-bold" data-testid="tutorial-step-title">{{ title }}</h2>
    <p class="mt-1 text-sm text-slate-700" data-testid="tutorial-step-description">{{ description }}</p>

    <div class="mt-4 flex items-center justify-between gap-2">
      <button
        data-testid="tutorial-prev-btn"
        class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-40"
        :disabled="isFirstStep"
        @click="$emit('previous')"
      >
        Previous
      </button>

      <div class="flex items-center gap-2">
        <button
          data-testid="tutorial-restart-btn"
          class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          @click="$emit('restart')"
        >
          Restart
        </button>

        <button
          data-testid="tutorial-next-btn"
          class="rounded-md bg-amber-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
          :disabled="!canGoNext"
          @click="$emit('next')"
        >
          {{ nextLabel || (isLastStep ? 'Finish' : 'Next') }}
        </button>
      </div>
    </div>
  </div>
</template>
