<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GameLayout from '@/layout/GameLayout.vue'
import TutorialScenarioMenu from '@/features/tutorial/ui/TutorialScenarioMenu.vue'
import TutorialSession from '@/features/tutorial/ui/TutorialSession.vue'
import { getScenarioById } from '@/features/tutorial/scenarios'
import { useIsMobile } from '@/common/composables/useIsMobile'

const route = useRoute()
const router = useRouter()
const isMobile = useIsMobile()

const scenario = computed(() => getScenarioById(route.params.scenarioId as string | undefined))
// ?bare=1 renders the board full-size without the sidebar (used by the rules screenshot script)
const bare = computed(() => route.query.bare === '1')
const bareStateId = computed(() => (typeof route.query.state === 'string' ? route.query.state : undefined))
</script>

<template>
  <GameLayout v-if="scenario" fixed>
    <TutorialSession
      :key="scenario.id"
      :scenario="scenario"
      :bare="bare"
      :bare-state-id="bareStateId"
      @exit="router.push('/tutorial')"
    />
  </GameLayout>

  <div v-else-if="isMobile" class="h-dvh overflow-hidden bg-hasen-base">
    <TutorialScenarioMenu
      @select="id => router.push(`/tutorial/${id}`)"
      @back="router.push('/')"
    />
  </div>
  <GameLayout v-else>
    <TutorialScenarioMenu
      @select="id => router.push(`/tutorial/${id}`)"
      @back="router.push('/')"
    />
  </GameLayout>
</template>
