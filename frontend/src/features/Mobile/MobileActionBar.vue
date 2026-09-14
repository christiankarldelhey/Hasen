<script setup lang="ts">
import { computed } from 'vue'
import type { ActionBarState, SheetTab } from './composables/useMobileInteraction'
import { useI18n } from '@/common/composables/useI18n'
import { useHasenStore } from '@/stores/hasenStore'
import { usePlayerObjectiveStatus } from '@/features/Score/composables/usePlayerObjectiveStatus'
import PlayerBidMarker from '@/common/components/PlayerBidMarker.vue'

interface Props {
  state: ActionBarState
  canConfirm: boolean
  canFinishTrick: boolean
  canMakeBids: boolean
  bidCount: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  openSheet: [tab: SheetTab]
  confirmPlay: []
  confirmSteal: []
  confirmReplacement: []
  skipReplacement: []
  finishTrick: []
  cancelSelection: []
}>()

const { t } = useI18n()

const hasenStore = useHasenStore()
const myId = computed(() => hasenStore.currentPlayerId || null)
const { points, status } = usePlayerObjectiveStatus(myId)

const scoreColor = computed(() => {
  if (status.value === 'winning') return 'text-hasen-green'
  if (status.value === 'losing') return 'text-hasen-red'
  return 'text-hasen-base'
})

const secondaryBtn =
  'flex-1 h-11 rounded-lg bg-hasen-dark/70 border border-hasen-base/40 text-hasen-base text-sm font-semibold transition-colors active:bg-hasen-dark'
const primaryBtn =
  'flex-1 h-11 rounded-lg bg-hasen-green border border-hasen-light/40 text-hasen-light text-sm font-semibold transition-colors disabled:opacity-50'
</script>

<template>
  <div class="flex items-center gap-2 h-full px-3">
    <!-- Fase de reemplazo -->
    <template v-if="props.state === 'replacement'">
      <button type="button" :class="secondaryBtn" @click="emit('skipReplacement')">
        {{ t('game.skipReplacement') }}
      </button>
      <button
        type="button"
        :class="primaryBtn"
        :disabled="!props.canConfirm"
        @click="emit('confirmReplacement')"
      >
        {{ t('game.replace') }}
      </button>
    </template>

    <!-- Robo de carta de la baza -->
    <template v-else-if="props.state === 'steal'">
      <button type="button" :class="secondaryBtn" @click="emit('cancelSelection')">
        {{ t('common.cancel') }}
      </button>
      <button type="button" :class="primaryBtn" @click="emit('confirmSteal')">
        {{ t('game.steal') }}
      </button>
    </template>

    <!-- Carta de mano seleccionada -->
    <template v-else-if="props.state === 'play'">
      <button type="button" :class="secondaryBtn" @click="emit('cancelSelection')">
        {{ t('common.cancel') }}
      </button>
      <button type="button" :class="primaryBtn" @click="emit('confirmPlay')">
        {{ t('game.throwCard') }}
      </button>
    </template>

    <!-- Cierre manual de la baza -->
    <template v-else-if="props.state === 'finish'">
      <button
        type="button"
        :class="primaryBtn"
        :disabled="!props.canFinishTrick"
        @click="emit('finishTrick')"
      >
        {{ t('game.finishTrick') }}
      </button>
    </template>

    <!-- Estado normal: accesos a la hoja -->
    <template v-else>
      <button type="button" :class="secondaryBtn" data-tutorial-id="game-scores player-round-score" @click="emit('openSheet', 'score')">
        {{ t('game.tabScore') }}
        <span :class="['ml-1 tabular-nums font-bold', scoreColor]">{{ points }}</span>
      </button>
      <button
        type="button"
        :class="[props.canMakeBids ? primaryBtn : secondaryBtn, 'inline-flex items-center justify-center gap-1.5']"
        data-tutorial-id="available-bids"
        @click="emit('openSheet', 'bids')"
      >
        {{ t('game.tabBids') }}
        <PlayerBidMarker
          v-if="myId && props.bidCount > 0"
          :player-id="myId"
          size="small"
        />
      </button>
    </template>
  </div>
</template>
