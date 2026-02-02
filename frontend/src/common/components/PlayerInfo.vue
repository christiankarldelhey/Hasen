<script setup lang="ts">
import { computed, inject } from 'vue'
import { AVAILABLE_PLAYERS, type PlayerId } from '@domain/interfaces/Player'
import { useGameScore } from '@/features/Score/composables/useGameScore'
import { usePlayers } from '@/features/Players/composables/usePlayers'
import PlayerAvatar from './PlayerAvatar.vue'

interface Props {
  playerId: PlayerId
  isPlayer?: boolean
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const { isPlayerTurn } = usePlayers()

const props = withDefaults(defineProps<Props>(), {
  isPlayer: false,
  position: 'bottom'
})

const isCurrentTurn = computed(() => isPlayerTurn.value(props.playerId))

const { playerScore } = useGameScore(props.playerId)

const player = computed(() => {
  return AVAILABLE_PLAYERS.find(p => p.id === props.playerId)
})

const playerColor = computed(() => player.value?.color || '#000000')

const playerName = computed(() => player.value?.name || 'Player')

const positionClasses = computed(() => {
  return props.position === 'left' || props.position === 'right' ? 'flex-row' : 'flex-col'
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
    :class="['flex', 'gap-3', playerClasses]"
  >
    <!-- Circular avatar with player color and white hare -->
    <div class="relative">
      <div :class="{ 'selectable-glow': isSelectable }">
        <PlayerAvatar 
          :playerId="playerId"
          size="medium"
          :showGlow="isCurrentTurn"
          :clickable="isSelectable"
          @click="handleClick"
        />
      </div>
      
      <!-- Score badge with star -->
      <div 
        class="absolute -bottom-1 -right-1 bg-hasen-base rounded-full px-2 py-0.5 flex items-center gap-0.5 shadow-lg border border-hasen-dark"
      >
        <svg class="w-3 h-3 fill-hasen-dark" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        <span class="text-hasen-dark font-bold text-xs">{{ playerScore }}</span>
      </div>
    </div>
    
    <!-- Player name label -->
    <div 
      :class="['bg-hasen-dark text-hasen-base px-3 py-1 rounded-full border font-semibold text-xs shadow-md', props.isPlayer ? 'self-end' : '', (props.position === 'right' || props.position === 'left') ? 'self-end' : '']"
      :style="{ borderColor: playerColor }"
    >
      {{ playerName }} {{ isPlayer ? '(You)' : '' }}
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

@keyframes selectableGlow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(59, 130, 246, 0.6);
  }
}

.animate-subtle-glow {
  animation: subtleGlow 3s ease-in-out infinite;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.selectable-glow {
  animation: selectableGlow 2s ease-in-out infinite;
  filter: brightness(1.2);
}
</style>
