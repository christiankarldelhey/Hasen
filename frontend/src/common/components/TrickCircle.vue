<script setup lang="ts">
import { computed } from 'vue'
import type { TrickNumber } from '@domain/interfaces'

interface Props {
  number?: TrickNumber
  state?: 'win' | 'lose' | 'current'
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 18
})

const backgroundColor = computed(() => {
  switch (props.state) {
    case 'win':
      return 'bg-hasen-green'
    case 'lose':
      return 'bg-hasen-red'
    case 'current':
    default:
      return 'bg-hasen-base'
  }
})

const textColor = computed(() => {
  if (props.number) {
    return 'text-hasen-dark'
  }
  return ''
})

const showNumber = computed(() => props.state === 'current' && props.number)
</script>

<template>
  <div 
    :class="[
      'rounded-full flex items-center justify-center border border-hasen-dark shadow-lg',
      backgroundColor,
      textColor
    ]"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <span 
      v-if="showNumber"
      :class="['font-bold', size <= 16 ? 'text-xs' : 'text-sm']"
    >
      {{ number }}
    </span>
  </div>
</template>
