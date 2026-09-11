<script setup lang="ts">
// Dev-only preview of the mobile board using the tutorial mock state.
// Route: /dev/mobile-board — lets you check the mobile layout without a backend.
import { computed, onMounted, onUnmounted, provide, ref } from 'vue'
import type { PlayerId, PrivateGameState, PublicGameState } from '@domain/interfaces'
import GameLayout from '@/layout/GameLayout.vue'
import MobileGameBoard from '@/features/Mobile/MobileGameBoard.vue'
import { provideAnimationCoords, useDealAnimation } from '@/features/Animations'
import { createTutorialMockState } from '@/features/tutorial/core/tutorialMockState'
import { useGameStore } from '@/stores/gameStore'
import { useHasenStore } from '@/stores/hasenStore'

const gameStore = useGameStore()
const hasenStore = useHasenStore()

const previousPublicGameState = ref<PublicGameState | null>(
  gameStore.publicGameState ? structuredClone(gameStore.publicGameState) : null
)
const previousPrivateGameState = ref<PrivateGameState | null>(
  gameStore.privateGameState ? structuredClone(gameStore.privateGameState) : null
)
const previousPlayerId = ref(hasenStore.currentPlayerId)

const animCoords = provideAnimationCoords()
const { isDealing, animatedCards, dealProgress } = useDealAnimation({ coords: animCoords })

provide('specialCards', {
  isPlayerSelectable: () => false,
  isCardSelectable: () => false,
  handlePlayerClick: () => {},
  handleCardClick: () => {},
})
provide('isDealing', isDealing)
provide('dealProgress', dealProgress)

const opponentPositions = computed(() => {
  const infos = gameStore.publicGameState?.opponentsPublicInfo || []
  const currentPlayerId = hasenStore.currentPlayerId
  const opponents = infos.filter((info) => info.playerId !== currentPlayerId)

  return opponents.slice(0, 3).map((opponent, index) => ({
    playerId: opponent.playerId,
    publicCardId: opponent.publicCardId,
    position: (index === 0 ? 'top' : index === 1 ? 'left' : 'right') as 'top' | 'left' | 'right',
  }))
})

const trickCards = computed(() => {
  const currentTrick = gameStore.publicGameState?.round.currentTrick
  if (!currentTrick) return []
  const publicCards = gameStore.publicGameState?.publicCards || {}
  return currentTrick.cards
    .map((cardId) => publicCards[cardId])
    .filter((card): card is NonNullable<typeof card> => card !== undefined)
})

const playerHand = computed(() => gameStore.privateGameState?.hand || [])
const winningCardId = computed(
  () => gameStore.publicGameState?.round.currentTrick?.winning_card || null
)
const trickState = computed(
  () => gameStore.publicGameState?.round.currentTrick?.trick_state || null
)
const isMyTurn = computed(
  () => gameStore.publicGameState?.round.playerTurn === hasenStore.currentPlayerId
)

const logAction = (name: string, ...args: unknown[]) =>
  console.log(`[mobile-dev] ${name}`, ...args)

onMounted(() => {
  const snapshot = createTutorialMockState()
  gameStore.setPublicGameState(snapshot.publicGameState)
  gameStore.setPrivateGameState(snapshot.privateGameState)
  hasenStore.setCurrentPlayerId(snapshot.currentPlayerId)
})

onUnmounted(() => {
  gameStore.reset()
  if (previousPublicGameState.value) {
    gameStore.setPublicGameState(previousPublicGameState.value)
  }
  if (previousPrivateGameState.value) {
    gameStore.setPrivateGameState(previousPrivateGameState.value)
  }
  if (previousPlayerId.value) {
    hasenStore.setCurrentPlayerId(previousPlayerId.value as PlayerId)
  }
})
</script>

<template>
  <GameLayout>
    <MobileGameBoard
      :opponent-positions="opponentPositions"
      :trick-cards="trickCards"
      :winning-card-id="winningCardId"
      :trick-state="trickState"
      :is-dealing="isDealing"
      :deal-progress="dealProgress"
      :player-hand="playerHand"
      hand-mode="normal"
      :is-my-turn="isMyTurn"
      :is-trick-in-resolve="false"
      :is-trick-winner="false"
      :can-finish-trick="false"
      :animated-cards="animatedCards"
      @play-card="(id) => logAction('playCard', id)"
      @finish-trick="logAction('finishTrick')"
      @skip-replacement="logAction('skipReplacement')"
      @confirm-replacement="(id, pos) => logAction('confirmReplacement', id, pos)"
    />
  </GameLayout>
</template>
