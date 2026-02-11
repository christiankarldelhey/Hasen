<script setup lang="ts">
import { computed } from 'vue'
import { AVAILABLE_PLAYERS, type PlayerId } from '@domain/interfaces/Player'
import Hare from './Hare.vue'

interface Props {
  playerId: PlayerId
  size?: 'tiny' | 'small' | 'medium' | 'large'
  showGlow?: boolean
  clickable?: boolean
  disableHover?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  showGlow: false,
  clickable: false,
  disableHover: false
})

const emit = defineEmits<{
  click: []
}>()

const player = computed(() => {
  return AVAILABLE_PLAYERS.find(p => p.id === props.playerId)
})

const playerColor = computed(() => player.value?.color || '#000000')

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'tiny':
      return 'w-6 h-6'
    case 'small':
      return 'w-12 h-12'
    case 'large':
      return 'w-24 h-24'
    case 'medium':
    default:
      return 'w-16 h-16'
  }
})

const hareSize = computed(() => {
  switch (props.size) {
    case 'tiny':
      return '15px'
    case 'small':
      return '24px'
    case 'large':
      return '56px'
    case 'medium':
    default:
      return '38px'
  }
})

const circleClasses = computed(() => ({
  'cursor-pointer': props.clickable,
  'hover:scale-110': props.clickable && !props.disableHover,
  'transition-all duration-300': true
}))

const handleClick = () => {
  if (props.clickable) {
    emit('click')
  }
}
</script>

<template>
  <div class="relative">
    <!-- Outer glow ring -->
    <div 
      v-if="showGlow"
      class="absolute inset-0 rounded-full animate-subtle-glow opacity-60"
      :style="{ backgroundColor: playerColor }"
    ></div>
    
    <!-- Main circle with gradient -->
    <div 
      :class="['relative rounded-full flex items-center justify-center shadow-lg', sizeClasses, circleClasses]"
      :style="{ 
        background: `radial-gradient(circle at 30% 30%, ${playerColor}dd, ${playerColor})`,
        border: clickable ? '3px solid #facc15' : `2px solid ${playerColor}`,
        boxShadow: showGlow ? `0 0 25px ${playerColor}80` : '0 3px 5px rgba(0,0,0,0.3)'
      }"
      @click="handleClick"
    >
      <Hare :size="hareSize" :color="showGlow ? 'white' : '#e2d2a8'" />
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

.animate-subtle-glow {
  animation: subtleGlow 3s ease-in-out infinite;
}
</style>
