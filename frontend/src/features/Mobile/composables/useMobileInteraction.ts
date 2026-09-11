import { ref, computed, inject, watch, type Ref, type ComputedRef } from 'vue'
import type { PlayingCard as Card } from '@domain/interfaces'
import type { PlayerId } from '@domain/interfaces/Player'
import { useGameStore } from '@/stores/gameStore'
import { useHasenStore } from '@/stores/hasenStore'
import { useI18n } from '@/common/composables/useI18n'

export type SheetTab = 'bids' | 'score'

export type ActionBarState =
  | 'default'        // Puntaje / Apuestas
  | 'play'           // Cancelar / Tirar (carta de mano seleccionada)
  | 'steal'          // Cancelar / Robar (carta de baza seleccionada)
  | 'replacement'    // Saltar / Reemplazar (fase player_drawing)
  | 'finish'         // Terminar baza (resolve + ganador/accionante)

interface SpecialCardsApi {
  isPlayerSelectable: (playerId: PlayerId) => boolean
  isCardSelectable: (cardId: string) => boolean
  handlePlayerClick: (playerId: PlayerId) => void
  handleCardClick: (cardId: string) => void
}

interface MobileInteractionDeps {
  handMode: Ref<'normal' | 'card_replacement'> | ComputedRef<'normal' | 'card_replacement'>
  isMyTurn: Ref<boolean> | ComputedRef<boolean>
  isTrickInResolve: Ref<boolean> | ComputedRef<boolean>
  isTrickWinner: Ref<boolean> | ComputedRef<boolean>
  canFinishTrick: Ref<boolean> | ComputedRef<boolean>
  handCards: Ref<Card[]> | ComputedRef<Card[]>
  actions: {
    playCard: (cardId: string) => void
    confirmReplacement: (cardId: string, position: number) => void
    skipReplacement: () => void
    finishTrick: () => void
  }
}

/**
 * Interaction state machine for the mobile board: two-step card play,
 * card replacement, steal/next-lead targeting, sheet and zoom overlays.
 */
export function useMobileInteraction(deps: MobileInteractionDeps) {
  const gameStore = useGameStore()
  const hasenStore = useHasenStore()
  const { t } = useI18n()

  const specialCards = inject<SpecialCardsApi | null>('specialCards', null)

  // --- Selection state -----------------------------------------------------
  const selectedHandCardId = ref<string | null>(null)
  const selectedStealCardId = ref<string | null>(null)
  const zoomCard = ref<Card | null>(null)

  // --- Sheet state ----------------------------------------------------------
  const sheetOpen = ref(false)
  const sheetTab = ref<SheetTab>('bids')
  const sheetPlayerId = ref<PlayerId | null>(null)

  // --- Toast ----------------------------------------------------------------
  const toastMessage = ref<string | null>(null)
  let toastTimer: ReturnType<typeof setTimeout> | null = null

  const showToast = (message: string) => {
    toastMessage.value = message
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      toastMessage.value = null
    }, 2600)
  }

  // --- Derived --------------------------------------------------------------
  const isStealSelectionActive = computed(() => {
    const action = gameStore.publicGameState?.round.currentTrick?.pendingSpecialAction
    return (
      gameStore.publicGameState?.round.currentTrick?.trick_state === 'awaiting_special_action' &&
      action?.type === 'STEAL_CARD' &&
      action.playerId === hasenStore.currentPlayerId
    )
  })

  const isHandCardDisabled = (card: Card): boolean => {
    // Carta pública no se puede reemplazar
    if (deps.handMode.value === 'card_replacement' && card.state === 'in_hand_visible') {
      return true
    }

    // berries-S no puede abrir la primera baza siendo lead
    const currentTrick = gameStore.publicGameState?.round.currentTrick
    if (!currentTrick) return false

    const isBerriesS = card.suit === 'berries' && card.char === 'S'
    const isFirstCardOfTrick = currentTrick.cards.length === 0
    const isFirstTrick = currentTrick.trick_number === 1
    const isLeadPlayer = currentTrick.lead_player === hasenStore.currentPlayerId

    return isBerriesS && isFirstCardOfTrick && isFirstTrick && isLeadPlayer
  }

  const selectedHandCard = computed(
    () => deps.handCards.value.find((c) => c.id === selectedHandCardId.value) ?? null
  )

  const canPlayZoomCard = computed(() => {
    const card = zoomCard.value
    if (!card) return false
    const inHand = deps.handCards.value.some((c) => c.id === card.id)
    return (
      inHand &&
      deps.handMode.value === 'normal' &&
      deps.isMyTurn.value &&
      !isHandCardDisabled(card)
    )
  })

  // Limpiar selecciones que quedan obsoletas (carta jugada, robo resuelto, cambio de fase)
  watch(deps.handCards as Ref<Card[]>, (cards) => {
    if (selectedHandCardId.value && !cards.some((c) => c.id === selectedHandCardId.value)) {
      selectedHandCardId.value = null
    }
  })

  watch(isStealSelectionActive, (active) => {
    if (!active) selectedStealCardId.value = null
  })

  watch(deps.handMode as Ref<'normal' | 'card_replacement'>, (mode) => {
    if (mode !== 'normal') selectedHandCardId.value = null
  })

  const actionBarState = computed<ActionBarState>(() => {
    if (deps.handMode.value === 'card_replacement' && deps.isMyTurn.value) return 'replacement'
    if (selectedStealCardId.value) return 'steal'
    if (selectedHandCardId.value) return 'play'
    if (deps.isTrickInResolve.value && deps.isTrickWinner.value) return 'finish'
    return 'default'
  })

  const canMakeBids = computed(() =>
    gameStore.isBidWindowOpenForPlayer(hasenStore.currentPlayerId || null)
  )

  const myBidCount = computed(() => {
    const id = hasenStore.currentPlayerId
    if (!id) return 0
    return gameStore.publicGameState?.round.roundBids.playerBids?.[id]?.length ?? 0
  })

  // --- Handlers -------------------------------------------------------------
  const clearSelection = () => {
    selectedHandCardId.value = null
    selectedStealCardId.value = null
  }

  const tapHandCard = (card: Card) => {
    if (deps.handMode.value === 'card_replacement') {
      if (card.state !== 'in_hand_hidden') return
      selectedHandCardId.value =
        selectedHandCardId.value === card.id ? null : card.id
      return
    }

    if (isStealSelectionActive.value) return // la mano no es target durante el robo
    if (!deps.isMyTurn.value) return
    if (isHandCardDisabled(card)) {
      showToast(t('game.cannotPlayCard'))
      return
    }

    if (selectedHandCardId.value === card.id) {
      // Segundo tap sobre la misma carta = jugar
      selectedHandCardId.value = null
      deps.actions.playCard(card.id)
    } else {
      selectedHandCardId.value = card.id
    }
  }

  const tapTrickCard = (card: Card) => {
    if (!specialCards?.isCardSelectable(card.id)) return
    if (selectedStealCardId.value === card.id) {
      // Segundo tap = confirmar robo
      selectedStealCardId.value = null
      specialCards.handleCardClick(card.id)
    } else {
      selectedStealCardId.value = card.id
    }
  }

  const tapPlayerChip = (playerId: PlayerId) => {
    if (specialCards?.isPlayerSelectable(playerId)) {
      specialCards.handlePlayerClick(playerId)
      return
    }
    openSheet('score', playerId)
  }

  const confirmPlay = () => {
    const id = selectedHandCardId.value
    if (!id) return
    selectedHandCardId.value = null
    deps.actions.playCard(id)
  }

  const confirmSteal = () => {
    const id = selectedStealCardId.value
    if (!id || !specialCards) return
    selectedStealCardId.value = null
    specialCards.handleCardClick(id)
  }

  const confirmReplacement = () => {
    const id = selectedHandCardId.value
    if (!id) return
    const position = deps.handCards.value.findIndex((c) => c.id === id)
    selectedHandCardId.value = null
    deps.actions.confirmReplacement(id, position)
  }

  const playZoomedCard = () => {
    const card = zoomCard.value
    zoomCard.value = null
    if (card) deps.actions.playCard(card.id)
  }

  // --- Sheet ----------------------------------------------------------------
  const openSheet = (tab: SheetTab, playerId: PlayerId | null = null) => {
    sheetTab.value = tab
    sheetPlayerId.value = playerId
    sheetOpen.value = true
  }

  const closeSheet = () => {
    sheetOpen.value = false
    sheetPlayerId.value = null
  }

  // --- Zoom -----------------------------------------------------------------
  const openZoom = (card: Card) => {
    zoomCard.value = card
  }

  const closeZoom = () => {
    zoomCard.value = null
  }

  return {
    // state
    selectedHandCardId,
    selectedHandCard,
    selectedStealCardId,
    zoomCard,
    sheetOpen,
    sheetTab,
    sheetPlayerId,
    toastMessage,
    // derived
    actionBarState,
    canMakeBids,
    myBidCount,
    canPlayZoomCard,
    isStealSelectionActive,
    isHandCardDisabled,
    // handlers
    tapHandCard,
    tapTrickCard,
    tapPlayerChip,
    confirmPlay,
    confirmSteal,
    confirmReplacement,
    playZoomedCard,
    clearSelection,
    openSheet,
    closeSheet,
    openZoom,
    closeZoom,
    showToast,
  }
}
