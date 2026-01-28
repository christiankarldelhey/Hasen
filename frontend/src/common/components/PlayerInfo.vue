<script setup lang="ts">
import { computed } from 'vue'
import { AVAILABLE_PLAYERS, type PlayerId } from '@domain/interfaces/Player'
import { useGameScore } from '@/features/Score/composables/useGameScore'

interface Props {
  playerId: PlayerId
  isPlayer?: boolean
  isCurrentTurn?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isCurrentTurn: false,
  isPlayer: false
})

const { playerScore } = useGameScore(props.playerId)

const player = computed(() => {
  return AVAILABLE_PLAYERS.find(p => p.id === props.playerId)
})

const playerColor = computed(() => player.value?.color || '#000000')
const playerName = computed(() => player.value?.name || 'Player')
</script>

<template>
  <div :class="['flex', 'gap-3', props.isPlayer ? 'flex-row items-center' : 'flex-col items-center' ]">
    <!-- Circular avatar with player color and white hare -->
    <div class="relative">
      <!-- Outer glow rings for current turn -->
      <div 
        v-if="isCurrentTurn"
        class="absolute inset-0 rounded-full animate-ping opacity-75"
        :style="{ backgroundColor: playerColor }"
      ></div>
      <div 
        v-if="isCurrentTurn"
        class="absolute inset-0 rounded-full animate-pulse"
        :style="{ 
          backgroundColor: playerColor,
          boxShadow: `0 0 20px ${playerColor}, 0 0 40px ${playerColor}`
        }"
      ></div>
      
      <!-- Main circle with gradient -->
      <div 
        class="relative w-18 h-18 rounded-full flex items-center justify-center shadow-lg"
        :class="{ 'animate-slow-pulse-bg': isCurrentTurn }"
        :style="{ 
          background: `radial-gradient(circle at 30% 30%, ${playerColor}dd, ${playerColor})`,
          border: `2px solid ${playerColor}`,
          boxShadow: isCurrentTurn ? `0 0 25px ${playerColor}` : '0 3px 5px rgba(0,0,0,0.3)',
          '--pulse-color-light': `${playerColor}dd`,
          '--pulse-color-dark': playerColor
        }"
      >
        <!-- White hare icon -->
        <svg 
          viewBox="0 0 385.26 420.69"
          class="w-10 h-10"
          style="fill: white; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"
        >
          <path d="M150.76,13.17c1.17.33.85-.31,1.14-.64,5.55-6.23,13.75-14.12,22.99-12.25,10.82,2.19,7.03,23.74,5.73,31.5-1.34,8.01-3.69,16.89-6.49,24.51-7.81,21.24-25.09,35.24-34.3,56.2-7.17,16.31-1.88,25.37-2.55,41.95-.18,4.54-1.55,10.17-1.56,14.48,0,3.66,1.92,4.96,5.27,5.27,4.96.46,10.23-.48,15-.54,24.64-.3,50.11-.54,74.39,3.66,48.82,8.44,99.22,35.91,120.73,82.27,11.21,24.16,13.97,50.78,10.16,77.09,7-5.19,14.93-9.85,24-9.5-2.38,12.62-4.17,27.41-11.49,38.26-7.6,11.27-18.85,13.6-30.12,19.38-14.34,7.36-26.15,19.06-40.71,25.79-11.98,5.54-24.83,8.12-37.91,9.59l-97.23-.31c-5.14-1.43-5.43-9.59-5.03-13.95,2.32-25.39,27.72-26.94,47.01-34.01.64-.24,1.31-.28,1.99-.25v-1.49c-5.37-1.25-10.68-3.68-15.51-6.25-15.5-8.24-27.37-23.13-47.01-17.53-5.53,1.58-9.08,5.58-11.21,10.79-6.74,16.44-13,60.34-34.5,63-13.68-1.24-30.18,1.61-43.52,0-8.51-1.03-7.13-13.68-4.83-19.36,3.93-9.74,11.35-9.12,18.33-14.67,9.54-7.58,15.53-27.39,13.14-39.12-2.71-13.31-23.3-32.47-31.29-45.21-14.27-22.77-12.32-59.6-13.6-85.9-.15-3.11-.38-8.25-1.55-10.95-2.45-5.67-9.67-6.51-14.78-8.72-14.88-6.45-32.89-22.2-22.18-39.85,5.89-9.7,30.02-35.97,39.06-42.94,11.47-8.85,22.8-8.37,36.08-10.41,4.35-.67,7.07-4.7,8.34-8.66,3.03-9.41,3.83-22.92,6.27-33.23,5.04-21.23,16.97-49.8,38.42-59.08,10.15-4.39,21.26-2.05,19.34,11.08Z"/>
        </svg>
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
      :class="['bg-hasen-dark text-hasen-base px-3 py-1 rounded-full border font-semibold text-xs shadow-md', props.isPlayer ? 'self-end' : '']"
      :style="{ borderColor: playerColor }"
    >
      {{ playerName }} {{ isPlayer ? '(You)' : '' }}
    </div>
  </div>
</template>

<style scoped>
@keyframes ping {
  75%, 100% {
    transform: scale(1.2);
    opacity: 0;
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

.animate-ping {
  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes slowPulseBg {
  0%, 100% {
    filter: brightness(0.85);
  }
  50% {
    filter: brightness(1.4);
  }
}

.animate-slow-pulse-bg {
  animation: slowPulseBg 2s ease-in-out infinite;
}
</style>
