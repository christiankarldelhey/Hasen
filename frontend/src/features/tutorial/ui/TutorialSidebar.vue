<script setup lang="ts">
import { computed, h } from 'vue'
import { useI18n } from '@/common/composables/useI18n'
import { renderInlineText } from '@/common/composables/useMarkdownRules'

interface Props {
  scenarioTitle: string
  title: string
  description: string
  stepIndex: number
  totalSteps: number
  isFirstStep: boolean
  isLastStep: boolean
  /** Step requires a board action; Next is disabled until it happens. */
  requiresAction: boolean
  /** Transient hint after a wrong action. */
  hint: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  next: []
  previous: []
  restart: []
  exit: []
  skip: []
}>()

const { t } = useI18n()

const stepCounter = computed(() => t('tutorial.stepCounter', {
  current: props.stepIndex + 1,
  total: props.totalSteps
}))

const progress = computed(() => ((props.stepIndex + 1) / props.totalSteps) * 100)

// Descriptions may contain [[card:suit-rank|label]] tokens, same as the rules docs.
const descriptionVNode = computed(() => h('span', renderInlineText(props.description, 'inline')))
</script>

<template>
  <aside
    class="tutorial-sidebar flex flex-col bg-hasen-base text-black shadow-2xl border-hasen-dark/40 md:border-l-2 border-t-2 md:border-t-0"
    data-testid="tutorial-sidebar"
  >
    <header class="px-4 pt-3 pb-2 border-b border-hasen-dark/20 flex items-center justify-between gap-2">
      <div class="min-w-0">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-hasen-dark/70 truncate">{{ scenarioTitle }}</p>
        <p class="text-xs text-hasen-dark/80">{{ stepCounter }}</p>
      </div>
      <button
        class="shrink-0 rounded-md border border-hasen-dark/30 bg-white/60 px-2 py-1 text-xs text-hasen-dark hover:bg-white"
        data-testid="tutorial-exit-btn"
        @click="emit('exit')"
      >
        {{ t('tutorial.exit') }}
      </button>
    </header>

    <div class="h-1 bg-hasen-dark/10">
      <div class="h-full bg-hasen-green transition-all duration-300" :style="{ width: `${progress}%` }" />
    </div>

    <div class="flex-1 overflow-y-auto px-4 py-3">
      <h2 class="text-lg font-bold leading-tight" data-testid="tutorial-step-title">{{ title }}</h2>
      <p class="mt-2 text-sm leading-relaxed text-gray-800" data-testid="tutorial-step-description">
        <component :is="descriptionVNode" />
      </p>

      <div
        v-if="requiresAction"
        class="mt-3 rounded-lg border border-amber-400 bg-amber-100/80 px-3 py-2 text-xs font-semibold text-amber-900"
        data-testid="tutorial-action-badge"
      >
        {{ t('tutorial.actionRequired') }}
      </div>

      <Transition name="hint">
        <div
          v-if="hint"
          class="mt-2 rounded-lg border border-hasen-red/60 bg-hasen-red/10 px-3 py-2 text-xs text-hasen-red"
          data-testid="tutorial-hint"
        >
          {{ hint }}
        </div>
      </Transition>
    </div>

    <footer class="px-4 py-3 border-t border-hasen-dark/20 flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <button
          data-testid="tutorial-prev-btn"
          class="flex-1 rounded-lg border border-hasen-dark/30 bg-white/70 px-3 py-2 text-sm font-semibold text-hasen-dark shadow disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white"
          :disabled="isFirstStep"
          @click="emit('previous')"
        >
          {{ t('tutorial.previous') }}
        </button>
        <button
          data-testid="tutorial-next-btn"
          class="flex-1 rounded-lg bg-hasen-green px-3 py-2 text-sm font-semibold text-hasen-light shadow disabled:opacity-40 disabled:cursor-not-allowed hover:bg-hasen-green-700"
          :disabled="requiresAction"
          @click="emit('next')"
        >
          {{ isLastStep ? t('tutorial.finish') : t('tutorial.next') }}
        </button>
      </div>
      <div class="flex items-center justify-between text-xs">
        <button
          class="text-hasen-dark/70 underline hover:text-hasen-dark"
          data-testid="tutorial-restart-btn"
          @click="emit('restart')"
        >
          {{ t('tutorial.restart') }}
        </button>
        <button
          v-if="requiresAction"
          class="text-hasen-dark/70 underline hover:text-hasen-dark"
          data-testid="tutorial-skip-btn"
          @click="emit('skip')"
        >
          {{ t('tutorial.skipAction') }}
        </button>
      </div>
    </footer>
  </aside>
</template>

<style scoped>
.hint-enter-active,
.hint-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.hint-enter-from,
.hint-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
