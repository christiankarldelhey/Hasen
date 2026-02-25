<script setup lang="ts">
import { computed, inject } from 'vue'
import { AVAILABLE_PLAYERS, type PlayerId, type TrickNumber } from '@domain/interfaces'
import { useGameScore } from '@/features/Score/composables/useGameScore'
import { usePlayers } from '@/features/Players/composables/usePlayers'
import { useGameStore } from '@/stores/gameStore'
import PlayerAvatar from './PlayerAvatar.vue'
import TrickCircle from './TrickCircle.vue'
import PlayerBidMarker from './PlayerBidMarker.vue'
import PlayerConnectionBadge from '@/features/PlayerConnection/components/PlayerConnectionBadge.vue'

interface Props {
  playerId: PlayerId
  isPlayer?: boolean
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
  isPlayer: false,
  position: 'bottom'
})

const { isPlayerTurn } = usePlayers()
const gameStore = useGameStore()

const playerConnectionStatus = computed(() => {
  return gameStore.publicGameState?.playerConnectionStatus?.[props.playerId] || 'connected'
})

const isCurrentTurn = computed(() => isPlayerTurn.value(props.playerId))

const { playerRoundScore } = useGameScore(props.playerId)

const currentTrickNumber = computed(() => {
  return gameStore.publicGameState?.round.currentTrick?.trick_number || 1
})

const tricksWon = computed(() => {
  return playerRoundScore.value?.tricksWon || []
})

const trickStates = computed(() => {
  const states: Array<{ trickNumber: TrickNumber; state: 'win' | 'lose' }> = []
  
  for (let i = 1; i < currentTrickNumber.value; i++) {
    const trickNum = i as TrickNumber
    const won = tricksWon.value.includes(trickNum)
    states.push({
      trickNumber: trickNum,
      state: won ? 'win' : 'lose'
    })
  }
  
  return states.reverse()
})

const currentTrickState = computed(() => {
  return currentTrickNumber.value <= 5 ? currentTrickNumber.value as TrickNumber : null
})


const player = computed(() => {
  return AVAILABLE_PLAYERS.find(p => p.id === props.playerId)
})

const playerColor = computed(() => player.value?.color || '#000000')

const playerName = computed(() => player.value?.name || 'Player')

const positionClasses = computed(() => {
  return props.position === 'left' || props.position === 'right' ? 'flex-row gap-2' : 'flex-col gap-4 mb-2'
})

const playerClasses = computed(() => {
  return [ props.isPlayer ? 'flex-row items-center' : 'flex-col items-center', positionClasses.value]
})

// Inyectar métodos de special cards
const specialCards = inject<any>('specialCards', null)

const isSelectable = computed(() => 
  specialCards?.isPlayerSelectable(props.playerId) ?? false
)

const handleClick = () => {
  if (isSelectable.value && specialCards) {
    specialCards.handlePlayerClick(props.playerId)
  }
}


</script>

<template>
  <div 
    :class="['flex', playerClasses]"
  >
    <!-- Circular avatar with player color and white hare -->
    <div class="relative">

        <PlayerAvatar 
          :playerId="playerId"
          size="medium"
          :showGlow="isCurrentTurn"
          :clickable="isSelectable"
          :disableHover="isSelectable"
          @click="handleClick"
        />
 
      
      <!-- Player bids marker - BOTTOM CENTERED -->
      <div class="absolute -bottom-3 left-1/2 -translate-x-1/2">
        <PlayerBidMarker :player-id="playerId" size="medium" />
      </div>

      <!-- Tricks stack con TrickCircle - TOP RIGHT -->
      <div 
        class="absolute -top-2 -right-1 bg-transparent px-3 flex"
      >
        <div class="relative flex items-center">
          <!-- Trick actual (con número) - al frente a la izquierda -->
          <div 
            v-if="currentTrickState"
            class="relative flex-shrink-0"
            :style="{ zIndex: 10 }"
          >
            <TrickCircle 
              :number="currentTrickState"
              state="current"
              :size="20"
            />
          </div>
          
          <!-- Tricks pasados (ganados/perdidos) - stackeados hacia la derecha -->
          <div 
            v-for="(trick, index) in trickStates" 
            :key="trick.trickNumber"
            class="absolute flex-shrink-0"
            :style="{ 
              zIndex: 9 - index,
              left: `${(index + 1) * 5}px` 
            }"
          >
            <TrickCircle 
              :state="trick.state"
              :size="20"
            />
          </div>
        </div>
      </div>

    </div>
    
    <!-- Player name label with connection badge -->
    <div class="flex flex-col items-center gap-1 self-end">
      <div 
        :class="['bg-hasen-dark text-hasen-base px-3 py-1 flex flex-row items-center gap-1 rounded-full border font-semibold text-xs shadow-md', (props.position === 'right' || props.position === 'left') ? 'self-end' : '']"
        :style="{ borderColor: playerColor }"
      >
        {{ playerName }} {{ isPlayer ? '(You)' : '' }}
      </div>
      <PlayerConnectionBadge :player-id="playerId" :status="playerConnectionStatus" />
    </div>
  </div>
</template>

<style scoped>
@keyframes subtleGlow {
  0%, 100% {
    transform: scale(1);
    opacity: 0.6;
    filter: brightness(1);
  }
  50% {
    transform: scale(1.20);
    opacity: 0.3;
    filter: brightness(1.3);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

</style>
