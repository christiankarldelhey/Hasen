<script setup lang="ts">
interface Props {
  padding?: 'none' | 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  padding: 'medium'
})

const paddingClasses = {
  none: '',
  small: 'px-2 pb-2 pt-1',
  medium: 'px-4 pb-4 pt-2',
  large: 'px-6 pb-6 pt-3'
}
</script>

<template>
  <div :class="['rounded-xl bg-black/70', paddingClasses[padding]]">
    <slot />
  </div>
</template>
