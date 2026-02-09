<script setup lang="ts">
interface Props {
  points: number
  variant?: 'win-points' | 'star'
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'win-points',
  size: 'medium'
})

const sizeClasses = {
  small: 'pl-1 pr-2 py-0.5 text-xs',
  medium: 'pl-2 pr-4 py-1 text-xs',
  large: 'pl-3 pr-5 py-1.5 text-sm'
}

const iconSizes = {
  small: 'w-2 h-2',
  medium: 'w-3 h-3',
  large: 'w-4 h-4'
}
</script>

<template>
  <div
    :class="[
      'bg-hasen-base rounded-full flex items-center gap-1 border border-hasen-dark whitespace-nowrap box-border',
      sizeClasses[size]
    ]"
  >
    <img
      v-if="variant === 'win-points'"
      src="@/assets/symbols/win-points.png"
      :class="['block', iconSizes[size]]"
      alt="Win points"
    />
    <span class="text-hasen-dark font-bold leading-none">
      {{ points }}
    </span>
  </div>
</template>
