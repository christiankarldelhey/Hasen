<script setup lang="ts">
import type { PlayingCard as Card, TrickState } from '@domain/interfaces'
import type { PlayerId } from '@domain/interfaces/Player'
import type { AnimatedCard } from '@/features/Animations'
import PlayerHand from '@/features/Players/PlayerHand.vue'
import GameInfo from '@/features/Game/GameInfo.vue'
import AvailableBids from '@/features/Bids/AvailableBids.vue'
import OtherPlayerHand from '@/features/Players/OtherPlayerHand.vue'
import Trick from '@/features/Trick/Trick.vue'
import AnimationOverlay from '@/features/Animations/components/AnimationOverlay.vue'

export interface OpponentPosition {
  playerId: PlayerId
  publicCardId: string | null
  position: 'top' | 'left' | 'right'
}

interface Props {
  opponentPositions: OpponentPosition[]
  trickCards: Card[]
  winningCardId?: string | null
  trickState?: TrickState | null
  isDealing: boolean
  dealProgress: Record<string, number>
  playerHand: Card[]
  handMode: 'normal' | 'card_replacement'
  isMyTurn: boolean
  isTrickInResolve: boolean
  isTrickWinner: boolean
  canFinishTrick: boolean
  animatedCards: AnimatedCard[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  skipReplacement: []
  confirmReplacement: [cardId: string, position: number]
  playCard: [cardId: string]
  finishTrick: []
}>()
</script>

<template>
  <div class="relative w-full h-screen" data-testid="game-board">
    <GameInfo />
    
    <AvailableBids />
    <!-- Oponentes en diferentes posiciones -->
    <OtherPlayerHand
      v-for="opponent in props.opponentPositions"
      :key="opponent.playerId"
      :player-id="opponent.playerId"
      :public-card-id="opponent.publicCardId"
      :position="opponent.position"
    />
    
    <!-- Trick en el centro exacto de la pantalla -->
    <Trick :cards="props.trickCards" :winning-card-id="props.winningCardId" :trick-state="props.trickState" />
    
    <!-- Animation overlay -->
    <AnimationOverlay :cards="props.animatedCards" />
    
    <!-- Mano del jugador (fixed en el bottom) -->
    <PlayerHand 
      :cards="props.isDealing ? props.playerHand.slice(0, props.dealProgress['player-hand'] ?? 0) : props.playerHand" 
      :mode="props.handMode"
      :is-my-turn="props.isMyTurn"
      :is-trick-in-resolve="props.isTrickInResolve"
      :is-trick-winner="props.isTrickWinner"
      :can-finish-trick="props.canFinishTrick"
      @skip-replacement="emit('skipReplacement')"
      @confirm-replacement="(cardId, position) => emit('confirmReplacement', cardId, position)"
      @play-card="(cardId) => emit('playCard', cardId)"
      @finish-trick="emit('finishTrick')"
    />
  </div>
</template>
