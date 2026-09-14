<script setup lang="ts">
import { useI18n } from '@/common/composables/useI18n'
import { tutorialScenarios } from '../scenarios'
import ActionButton from '@/common/components/ActionButton.vue'

const emit = defineEmits<{
  select: [scenarioId: string]
  back: []
}>()

const { t } = useI18n()
</script>

<template>
  <div
    class="card bg-hasen-base w-full md:w-[40%] h-dvh md:h-[85vh] rounded-none md:card-border md:rounded-box md:shadow-lg flex flex-col relative overflow-hidden"
    data-testid="tutorial-menu"
  >
    <div class="card-header z-10">
      <h1 class="text-center text-2xl font-semibold text-black mt-4">{{ t('tutorial.menu.title') }}</h1>
    </div>
    <div class="card-body z-10 !p-0 flex flex-col overflow-hidden">
      <div class="px-8 pt-8 pb-4 flex-shrink-0">
        <ActionButton
          data-testid="tutorial-menu-back-btn"
          :label="t('lobby.backToMenu')"
          variant="tertiary"
          @click="emit('back')"
        />
      </div>

      <div class="flex-1 overflow-y-auto px-8 pb-8">
        <div class="flex flex-col gap-3">
          <button
            v-for="scenario in tutorialScenarios"
            :key="scenario.id"
            type="button"
            class="rounded-xl border-2 border-hasen-green/60 bg-white/80 px-4 py-3 text-left text-black transition-colors hover:bg-white"
            :data-testid="`tutorial-scenario-${scenario.id}`"
            @click="emit('select', scenario.id)"
          >
            <div class="flex items-center gap-2">
              <span v-if="scenario.icon" class="text-xl">{{ scenario.icon }}</span>
              <span class="font-bold">{{ t(scenario.title) }}</span>
              <span class="ml-auto text-xs text-gray-500">
                {{ t('tutorial.menu.steps', { count: scenario.steps.length }) }}
              </span>
            </div>
            <p class="mt-1 text-sm text-gray-700">{{ t(scenario.description) }}</p>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
