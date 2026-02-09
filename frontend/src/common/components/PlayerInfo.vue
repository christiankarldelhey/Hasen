<script setup lang="ts">
import { computed, inject } from 'vue'
import { AVAILABLE_PLAYERS, type PlayerId, type TrickNumber } from '@domain/interfaces'
import { useGameScore } from '@/features/Score/composables/useGameScore'
import { usePlayers } from '@/features/Players/composables/usePlayers'
import { useGameStore } from '@/stores/gameStore'
import PlayerAvatar from './PlayerAvatar.vue'
import { IconStar } from '@tabler/icons-vue'
import TrickCircle from './TrickCircle.vue'
import ScoreBadge from './ScoreBadge.vue'

interface Props {
  playerId: PlayerId
  isPlayer?: boolean
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const { isPlayerTurn } = usePlayers()
const gameStore = useGameStore()

const props = withDefaults(defineProps<Props>(), {
  isPlayer: false,
  position: 'bottom'
})

const isCurrentTurn = computed(() => isPlayerTurn.value(props.playerId))

const { playerScore, playerRoundScore } = useGameScore(props.playerId)

const currentTrickNumber = computed(() => {
  return gameStore.publicGameState?.round.currentTrick?.trick_number || 1
})

const tricksWon = computed(() => {
  return playerRoundScore.value?.tricksWon || []
})

const points = computed(() => playerRoundScore.value?.points ?? 0)

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
  return props.position === 'left' || props.position === 'right' ? 'flex-row gap-2' : 'flex-col gap-4'
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
 
      
      <!-- Score badge with points - BOTTOM CENTERED -->
      <div class="absolute -bottom-2 left-1/2 -translate-x-1/2">
        <ScoreBadge :points="points" variant="win-points" size="medium" />
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
    
    <!-- Player name label -->
    <div 
      :class="['bg-hasen-dark text-hasen-base px-3 py-1 flex flex-row items-center gap-1 rounded-full border font-semibold text-xs shadow-md', props.isPlayer ? 'self-end' : '', (props.position === 'right' || props.position === 'left') ? 'self-end' : '']"
      :style="{ borderColor: playerColor }"
    >
      {{ playerName }} {{ isPlayer ? '(You)' : '' }}  <IconStar :size="12" class="text-hasen-base" /> <span :class="['font-semibold text-xs', playerScore >= 0 ? '' : 'text-hasen-red']">{{ playerScore }}</span>
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
