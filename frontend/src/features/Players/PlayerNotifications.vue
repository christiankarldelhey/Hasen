<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useHasenStore } from '@/stores/hasenStore'
import { usePlayers } from './composables/usePlayers'
import { useI18n } from '@/common/composables/useI18n'

const { getPlayerNameById } = usePlayers()
const { t } = useI18n()

const gameStore = useGameStore()
const hasenStore = useHasenStore()

const currentPhase = computed(() => 
  gameStore.publicGameState?.round.roundPhase
)

const isPlayerDrawingPhase = computed(() => 
  currentPhase.value === 'player_drawing'
)

const isPlayingPhase = computed(() => 
  currentPhase.value === 'playing'
)

const isTrickInResolve = computed(() => 
  currentTrick.value?.trick_state === 'resolve'
)

const currentTrick = computed(() => 
  gameStore.publicGameState?.round.currentTrick
)

const pendingSpecialAction = computed(() => 
  currentTrick.value?.pendingSpecialAction
)

const isAwaitingSpecialAction = computed(() => 
  currentTrick.value?.trick_state === 'awaiting_special_action'
)

const playerCardInTrick = computed(() => {
  if (!currentTrick.value || !hasenStore.currentPlayerId) return null
  
  const publicCards = gameStore.publicGameState?.publicCards || {}
  const trickCardIds = currentTrick.value.cards
  
  for (const cardId of trickCardIds) {
    const card = publicCards[cardId]
    if (card && card.owner === hasenStore.currentPlayerId) {
      return card
    }
  }
  
  return null
})

const playedSpecialCard = computed(() => {
  const card = playerCardInTrick.value
  if (!card || card.char !== 'S') return null
  
  // Determine which special card based on suit
  if (card.suit === 'acorns') return 'PICK_NEXT_LEAD'
  if (card.suit === 'leaves') return 'STEAL_CARD'
  if (card.suit === 'berries') return 'RASPBERRY'
  
  return null
})

const shouldShowTurnInfo = computed(() => 
  isPlayerDrawingPhase.value || isPlayingPhase.value || isAwaitingSpecialAction.value || isTrickInResolve.value
)

const currentPlayerTurn = computed(() => 
  gameStore.publicGameState?.round.playerTurn
)

const isMyTurn = computed(() => 
  currentPlayerTurn.value === hasenStore.currentPlayerId
)

const currentPlayerName = computed(() => {
  return currentPlayerTurn.value ? getPlayerNameById.value(currentPlayerTurn.value) : undefined
})

const turnMessage = computed(() => {
  // Prioridad a acciones especiales
  if (isAwaitingSpecialAction.value && pendingSpecialAction.value) {
    const actionPlayerId = pendingSpecialAction.value.playerId
    const actionPlayerName = getPlayerNameById.value(actionPlayerId)
    const isMyAction = actionPlayerId === hasenStore.currentPlayerId
    
    if (pendingSpecialAction.value.type === 'PICK_NEXT_LEAD') {
      return {
        title: isMyAction ? '🫐 Select Next Lead Player!' : `⏳ Waiting for ${actionPlayerName}`,
        subtitle: isMyAction ? 'Choose who will lead the next trick' : 'Selecting the next lead player...'
      }
    } else if (pendingSpecialAction.value.type === 'STEAL_CARD') {
      return {
        title: isMyAction ? '🍃 Select Card to Steal!' : `⏳ Waiting for ${actionPlayerName}`,
        subtitle: isMyAction ? 'Choose a card from the trick to steal' : 'Selecting a card to steal...'
      }
    }
  }
  
  // Trick resolve state - show winner/loser notifications
  if (isTrickInResolve.value) {
    const trickWinnerId = currentTrick.value?.score.trick_winner
    const isActualWinner = trickWinnerId === hasenStore.currentPlayerId
    
    // Check if player has completed a special action
    const hasCompletedSpecialAction = currentTrick.value?.pendingSpecialAction?.playerId === hasenStore.currentPlayerId &&
      ((currentTrick.value.pendingSpecialAction.type === 'PICK_NEXT_LEAD' && currentTrick.value.pendingSpecialAction.selectedNextLead) ||
       (currentTrick.value.pendingSpecialAction.type === 'STEAL_CARD' && currentTrick.value.pendingSpecialAction.selectedCardToSteal))
    
    if (isActualWinner) {
      return {
        title: `🏆 ${t('game.trickWon')}`,
        subtitle: t('game.trickWonSubtitle')
      }
    } else if (hasCompletedSpecialAction) {
      // Player lost but completed their special action, they can finish the trick
      return {
        title: t('game.trickLost'),
        subtitle: t('game.trickWonSubtitle') // Same as winner: "Click Finish Trick to continue"
      }
    } else {
      // Player lost the trick
      const specialCard = playedSpecialCard.value
      
      if (specialCard === 'PICK_NEXT_LEAD') {
        return {
          title: t('game.trickLost'),
          subtitle: t('game.trickLostButPickNextLead')
        }
      } else if (specialCard === 'STEAL_CARD') {
        return {
          title: t('game.trickLost'),
          subtitle: t('game.trickLostButStoleCard')
        }
      } else {
        return {
          title: t('game.trickLost'),
          subtitle: t('game.trickLostWait')
        }
      }
    }
  }
  
  if (isMyTurn.value) {
    if (isPlayerDrawingPhase.value) {
      return {
        title: 'Your turn!',
        subtitle: 'Choose to skip or replace a card'
      }
    } else {
      const canMakeBids = currentTrick.value && currentTrick.value.trick_number <= 3
      return {
        title: 'Your turn!',
        subtitle: canMakeBids 
          ? 'Make Bids (optional) then play a card'
          : 'Play a card'
      }
    }
  } else {
    return {
      title: `Waiting for ${currentPlayerName.value}`,
      subtitle: 'Player is deciding...'
    }
  }
})
</script>

<template>
  <div v-if="shouldShowTurnInfo">
    <div 
      class="rounded-lg px-8 py-4 shadow-lg transition-colors duration-300 w-full"
      :class="isMyTurn ? 'bg-hasen-base' : 'bg-hasen-base'">
      <div class="text-hasen-dark">
        <p class="font-bold text-lg">{{ turnMessage.title }}</p>
        <p class="text-sm opacity-90">{{ turnMessage.subtitle }}</p>
      </div>
    </div>
  </div>
</template>
