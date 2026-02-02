import { ref, computed, watch } from 'vue';
import type { PlayerId } from '@domain/interfaces';
import type { GameEvent } from '@domain/events/GameEvents';
import { useHasenStore } from '@/stores/hasenStore';
import { useSocketGame } from './useSocketGame';
import { useGameStore } from '@/stores/gameStore';

export interface NextLeadSelection {
  playerId: PlayerId;
  availablePlayers: PlayerId[];
}

export interface CardStealSelection {
  playerId: PlayerId;
  availableCards: string[];
  trickNumber: number;
}

/**
 * Composable para manejar el estado y eventos de cartas especiales
 * 
 * @param gameId - ID del juego actual
 * @returns Objeto con estado y métodos para manejar cartas especiales
 * 
 * @remarks
 * Este composable gestiona:
 * - Estado de selección de próximo lead (PICK_NEXT_LEAD)
 * - Estado de selección de carta a robar (STEAL_CARD)
 * - Validación de jugadores/cartas seleccionables
 * - Handlers para clicks en jugadores/cartas
 * 
 * Se sincroniza automáticamente con el estado del trick mediante:
 * - Watcher reactivo del trick actual
 * - Event handlers de eventos de special cards
 */
export function useSpecialCards(gameId: string) {
  const hasenStore = useHasenStore();
  const socketGame = useSocketGame();
  const gameStore = useGameStore();
  
  const nextLeadSelection = ref<NextLeadSelection | null>(null);
  const cardStealSelection = ref<CardStealSelection | null>(null);

  const hasActiveSelection = computed(() => {
    return nextLeadSelection.value !== null || cardStealSelection.value !== null;
  });

  const selectionType = computed<'PICK_NEXT_LEAD' | 'STEAL_CARD' | null>(() => {
    if (nextLeadSelection.value) return 'PICK_NEXT_LEAD';
    if (cardStealSelection.value) return 'STEAL_CARD';
    return null;
  });

  /**
   * Limpia todas las selecciones pendientes de cartas especiales
   * 
   * @remarks
   * Se llama automáticamente cuando:
   * - El trick actual es null
   * - El trick pasa a estado 'resolve'
   */
  const clearSelections = () => {
    nextLeadSelection.value = null;
    cardStealSelection.value = null;
  };

  // Crear computed para el trick actual (reactivo)
  const currentTrick = computed(() => gameStore.publicGameState?.round.currentTrick || null);
  const activePlayers = computed(() => gameStore.publicGameState?.activePlayers || []);

  // Detectar automáticamente cuando el trick está esperando acción especial
  watch(currentTrick, (trick) => {
    if (!trick) {
      clearSelections();
      return;
    }

    if (trick.trick_state === 'awaiting_special_action' && trick.pendingSpecialAction) {
      const action = trick.pendingSpecialAction;

      if (action.type === 'PICK_NEXT_LEAD' && !nextLeadSelection.value) {
        nextLeadSelection.value = {
          playerId: action.playerId,
          availablePlayers: activePlayers.value
        };
      } else if (action.type === 'STEAL_CARD' && !cardStealSelection.value) {
        cardStealSelection.value = {
          playerId: action.playerId,
          availableCards: trick.cards,
          trickNumber: trick.trick_number
        };
      }
    } else if (trick.trick_state === 'resolve') {
      clearSelections();
    }
  }, { immediate: true, deep: true });

  /**
   * Procesa eventos de cartas especiales del servidor
   * 
   * @param event - Evento del juego a procesar
   * 
   * @remarks
   * Maneja los siguientes tipos de eventos:
   * - PICK_NEXT_LEAD: Activa selección de próximo lead
   * - NEXT_LEAD_PLAYER_SELECTED: Limpia selección de lead
   * - PICK_CARD_FROM_TRICK: Activa selección de carta a robar
   * - CARD_STOLEN_FROM_TRICK: Limpia selección de carta
   */
  const handleSpecialCardEvent = (event: GameEvent) => {
    switch (event.type) {
      case 'PICK_NEXT_LEAD':
        nextLeadSelection.value = {
          playerId: event.payload.playerId,
          availablePlayers: event.payload.availablePlayers
        };
        break;

      case 'NEXT_LEAD_PLAYER_SELECTED':
        nextLeadSelection.value = null;
        break;

      case 'PICK_CARD_FROM_TRICK':
        cardStealSelection.value = {
          playerId: event.payload.playerId,
          availableCards: event.payload.availableCards,
          trickNumber: event.payload.trickNumber
        };
        break;

      case 'CARD_STOLEN_FROM_TRICK':
        cardStealSelection.value = null;
        break;
    }
  };

  /**
   * Determina si un jugador es seleccionable para PICK_NEXT_LEAD
   * 
   * @param playerId - ID del jugador a verificar
   * @returns true si el jugador puede ser seleccionado como próximo lead
   * 
   * @remarks
   * Un jugador es seleccionable si:
   * - Hay una selección de next lead activa
   * - El jugador actual es quien debe seleccionar
   * - El playerId está en la lista de jugadores disponibles
   */
  const isPlayerSelectable = (playerId: PlayerId): boolean => {
    if (!nextLeadSelection.value) return false;
    
    // Solo si soy el jugador que debe seleccionar
    const isMySelection = nextLeadSelection.value.playerId === hasenStore.currentPlayerId;
    if (!isMySelection) return false;
    
    // Solo si el playerId está en la lista de disponibles
    return nextLeadSelection.value.availablePlayers.includes(playerId);
  };

  /**
   * Determina si una carta es seleccionable para STEAL_CARD
   * 
   * @param cardId - ID de la carta a verificar
   * @returns true si la carta puede ser robada
   * 
   * @remarks
   * Una carta es seleccionable si:
   * - Hay una selección de card steal activa
   * - El jugador actual es quien debe seleccionar
   * - El cardId está en la lista de cartas disponibles del trick
   */
  const isCardSelectable = (cardId: string): boolean => {
    if (!cardStealSelection.value) {
      return false;
    }
    
    const isMySelection = cardStealSelection.value.playerId === hasenStore.currentPlayerId;
    if (!isMySelection) return false;
    
    const isAvailable = cardStealSelection.value.availableCards.includes(cardId);
    return isAvailable;
  };

  /**
   * Maneja el click en un jugador para seleccionarlo como próximo lead
   * 
   * @param playerId - ID del jugador clickeado
   * 
   * @remarks
   * Solo emite el evento al servidor si el jugador es seleccionable.
   * El servidor validará la selección y emitirá NEXT_LEAD_PLAYER_SELECTED.
   */
  const handlePlayerClick = (playerId: PlayerId) => {
    if (isPlayerSelectable(playerId)) {
      socketGame.selectNextLeadPlayer(gameId, playerId);
    }
  };

  /**
   * Maneja el click en una carta para robarla del trick
   * 
   * @param cardId - ID de la carta clickeada
   * 
   * @remarks
   * Solo emite el evento al servidor si la carta es seleccionable.
   * El servidor procesará el robo y emitirá CARD_STOLEN_FROM_TRICK.
   */
  const handleCardClick = (cardId: string) => {
    if (isCardSelectable(cardId)) {
      console.log(`🍃 Stealing card ${cardId}`);
      socketGame.selectCardToSteal(gameId, cardId);
    }
  };

  return {
    nextLeadSelection,
    cardStealSelection,
    hasActiveSelection,
    selectionType,
    isPlayerSelectable,
    isCardSelectable,
    handlePlayerClick,
    handleCardClick,
    handleSpecialCardEvent,
    clearSelections
  };
}
