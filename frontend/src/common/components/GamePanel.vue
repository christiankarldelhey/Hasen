<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  padding?: 'none' | 'small' | 'medium' | 'large'
  highlighted?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  padding: 'medium',
  highlighted: false
})

const paddingClasses = {
  none: '',
  small: 'px-2 pb-2 pt-1',
  medium: 'px-4 pb-4 pt-2',
  large: 'px-6 pb-6 pt-3'
}

const panelClasses = computed(() => {
  const base = ['rounded-xl', paddingClasses[props.padding]]
  
  if (props.highlighted) {
    base.push('bg-black/70', 'ring-2', 'ring-hasen-light', 'shadow-lg', 'shadow-hasen-light/50', 'bid-panel-highlight')
  } else {
    base.push('bg-black/70')
  }
  
  return base
})
</script>

<template>
  <div :class="panelClasses">
    <slot />
  </div>
</template>

<style scoped>
@keyframes bidPulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(255, 223, 186, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(255, 223, 186, 0.6);
  }
}

.bid-panel-highlight {
  animation: bidPulse 2s ease-in-out infinite;
}
</style>
