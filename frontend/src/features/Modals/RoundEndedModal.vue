<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { AVAILABLE_PLAYERS, type PlayerId } from '@domain/interfaces/Player'
import type { Round } from '@domain/interfaces/Round'
import { useRoundScore } from '@/features/Score/composables/useRoundScore'
import { useGameStore } from '@/stores/gameStore'
import { useI18n } from '@/common/composables/useI18n'
import BaseModal from '@/common/components/BaseModal.vue'
import PlayerAvatar from '@/common/components/PlayerAvatar.vue'
import PlayerNameLabel from '@/common/components/PlayerNameLabel.vue'
import BidWinCondition from '@/features/Bids/BidWinCondition.vue'

interface Props {
  isOpen: boolean
  round: Round | null
  readyPlayers?: PlayerId[]
  totalPlayers?: number
}

const props = withDefaults(defineProps<Props>(), {
  readyPlayers: () => [],
  totalPlayers: 0
})

const emit = defineEmits<{
  close: []
  continue: []
}>()

const isWaiting = ref(false)

// Reset local waiting state each time the modal is opened for a new round.
// Without this, a previous round's "waiting" state can leak into the next round.
watch(
  [() => props.isOpen, () => props.round?.round],
  ([isOpen]) => {
    if (isOpen) {
      isWaiting.value = false
    }
  }
)

const handleContinue = () => {
  isWaiting.value = true
  emit('continue')
}

const handleClose = () => {
  // Si el jugador cierra el modal (click fuera o X), también cuenta como "continue"
  // para evitar que quede trabado esperando
  if (!isWaiting.value) {
    handleContinue()
  }
  emit('close')
}

const isPlayerReady = (playerId: PlayerId) => {
  return props.readyPlayers.includes(playerId)
}

const { playersResults } = useRoundScore()
const gameStore = useGameStore()
const { t } = useI18n()

// Determinar si debemos mostrar resultados o espera
const shouldShowResults = computed(() => {
  // Siempre mostrar resultados si hay datos del round
  const hasRoundData = gameStore.publicGameState?.round?.roundPhase === 'scoring'
  const hasPlayersResults = playersResults.value.length > 0

  // Mostrar resultados si hay datos del round Y no estamos esperando explícitamente
  return (hasRoundData && hasPlayersResults) && !isWaiting.value
})

</script>

<template>
  <BaseModal :isOpen="isOpen" :title="!shouldShowResults ? t('game.waitingForPlayers') : t('game.roundEnded')" maxWidth="2xl" @close="handleClose">
    <!-- Estado: Mostrando resultados -->
    <div v-if="shouldShowResults" class="space-y-4">
      <!-- Player Results -->
      <div v-for="playerInfo in playersResults" :key="playerInfo.playerId" class="space-y-2">
        <!-- Player Header -->
        <div class="flex items-center gap-3 pb-2">
          <PlayerAvatar :playerId="playerInfo.playerId" size="small" />
          <div class="flex-1">
            <h3 class="font-bold text-lg">
              <PlayerNameLabel :playerId="playerInfo.playerId" :showYou="false" size="large" />
            </h3>
            <div class="text-sm text-hasen-dark/70 flex flex-row justify-between items-center gap-2">
              <div>
                {{ t('game.roundScore') }}:
                <span :class="playerInfo.roundScore >= 0 ? 'text-lg text-hasen-green font-semibold' : 'text-lg text-hasen-red font-semibold'">
                  {{ playerInfo.roundScore }}
                </span>
              </div>
              
              <div>
                {{ t('common.totalScore') }}:
                <span :class="playerInfo.totalScore >= 0 ? 'text-lg text-hasen-green font-semibold' : 'text-lg text-hasen-red font-semibold'">
                  {{ playerInfo.totalScore }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Player Bids -->
        <div v-if="playerInfo.hasBids" class="space-y-2">
          <div 
            v-for="(bidInfo, index) in playerInfo.bids" 
            :key="index"
            :class="['flex items-center justify-between p-2 rounded-lg', 
              bidInfo.isWinning === true ? 'bg-hasen-green/20 text-hasen-green' : 'bg-hasen-red/20 text-hasen-red']"
          >
            <div class="flex items-center gap-2 flex-1">
              <BidWinCondition 
                :type="bidInfo.bid.bid_type" 
                :win_condition="bidInfo.bid.win_condition"
              />
            </div>
            <div class="flex items-center gap-2">
              <span class="font-bold px-2 py-1 rounded text-lg text-hasen-dark/70" >
                {{ bidInfo.score > 0 ? '+' : '' }}{{ bidInfo.score }}
              </span>
            </div>
          </div>
        </div>

        <!-- No Bids Message -->
         <div v-else 
          class="flex items-center justify-between px-2 rounded-lg bg-hasen-base border border-hasen-dark/20 py-3">
          <div class="pl-2 text-md text-hasen-dark/70 italic">
            {{ t('game.cardPointsNoBids') }}
          </div>
          <div class="font-bold px-2 rounded text-lg text-hasen-dark/70">
            {{ playerInfo.cardPoints > 0 ? '+' : '' }}{{ playerInfo.cardPoints }}
          </div>
         </div>
      </div>
    </div>

    <!-- Estado: Esperando jugadores -->
    <div v-else class="space-y-6 py-4">
      <div class="text-center">
        <p class="text-lg text-hasen-dark/70 mb-2">{{ t('game.waitingForOthers') }}</p>
        <p class="text-sm font-bold text-hasen-dark">{{ t('game.playersReady', { count: readyPlayers.length, total: totalPlayers }) }}</p>
      </div>

      <!-- Lista de jugadores con estado ready -->
      <div class="grid grid-cols-2 gap-4">
        <div 
          v-for="player in AVAILABLE_PLAYERS.slice(0, totalPlayers)" 
          :key="player.id"
          class="flex items-center gap-3 p-3 rounded-lg bg-hasen-dark/5"
        >
          <PlayerAvatar :playerId="player.id" size="small" />
          <div class="flex-1">
            <p class="font-semibold text-sm">{{ player.name }}</p>
          </div>
          <div class="text-2xl">
            {{ isPlayerReady(player.id) ? '✓' : '⏳' }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <button 
          v-if="!isWaiting"
          @click="handleContinue"
          class="px-6 py-2 bg-hasen-green text-white rounded-lg font-semibold hover:bg-hasen-green/90 transition-colors"
        >
          {{ t('game.continue') }}
        </button>
        <div v-else class="text-sm text-hasen-dark/50 italic">
          {{ t('game.waitingAllPlayersToContinue') }}
        </div>
      </div>
    </template>
  </BaseModal>
</template>
