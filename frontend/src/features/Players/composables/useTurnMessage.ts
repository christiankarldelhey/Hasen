import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useHasenStore } from '@/stores/hasenStore'
import { usePlayers } from './usePlayers'
import { useI18n } from '@/common/composables/useI18n'

export interface TurnMessage {
  title: string
  subtitle: string
}

/**
 * Turn / phase status message shared by the desktop PlayerNotifications
 * panel and the mobile status line.
 */
export function useTurnMessage() {
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

  const currentTrick = computed(() =>
    gameStore.publicGameState?.round.currentTrick
  )

  const isTrickInResolve = computed(() =>
    currentTrick.value?.trick_state === 'resolve'
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

    if (card.suit === 'acorns') return 'PICK_NEXT_LEAD'
    if (card.suit === 'leaves') return 'STEAL_CARD'
    if (card.suit === 'berries') return 'RASPBERRY'

    return null
  })

  const shouldShow = computed(() =>
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

  const turnMessage = computed<TurnMessage | null>(() => {
    // Prioridad a acciones especiales
    if (isAwaitingSpecialAction.value && pendingSpecialAction.value) {
      const actionPlayerId = pendingSpecialAction.value.playerId
      const actionPlayerName = getPlayerNameById.value(actionPlayerId)
      const isMyAction = actionPlayerId === hasenStore.currentPlayerId

      if (pendingSpecialAction.value.type === 'PICK_NEXT_LEAD') {
        return {
          title: isMyAction ? `🫐 ${t('game.selectNextLeadPlayer')}` : `⏳ ${t('game.waitingForPlayer', { player: actionPlayerName || '' })}`,
          subtitle: isMyAction ? t('game.chooseWhoLeadsNextTrick') : t('game.selectingNextLeadPlayer')
        }
      } else if (pendingSpecialAction.value.type === 'STEAL_CARD') {
        return {
          title: isMyAction ? `🍃 ${t('game.selectCardToSteal')}` : `⏳ ${t('game.waitingForPlayer', { player: actionPlayerName || '' })}`,
          subtitle: isMyAction ? t('game.chooseCardFromTrickToSteal') : t('game.selectingCardToSteal')
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
        return {
          title: t('game.trickLost'),
          subtitle: t('game.trickWonSubtitle')
        }
      } else {
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
          title: t('game.yourTurn'),
          subtitle: t('game.chooseSkipOrReplace')
        }
      } else {
        const canMakeBids = currentTrick.value && currentTrick.value.trick_number <= 3
        return {
          title: t('game.yourTurn'),
          subtitle: canMakeBids
            ? t('game.makeBidsThenPlay')
            : t('game.playCard')
        }
      }
    } else {
      return {
        title: t('game.waitingForPlayer', { player: currentPlayerName.value || '' }),
        subtitle: t('game.playerDeciding')
      }
    }
  })

  return {
    shouldShow,
    turnMessage,
    isMyTurn
  }
}
