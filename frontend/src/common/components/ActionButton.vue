<script setup lang="ts">
interface Props {
  label: string
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger'
}

withDefaults(defineProps<Props>(), {
  disabled: false,
  variant: 'primary'
})

const emit = defineEmits<{
  click: []
}>()

const variantClasses = {
  primary: 'bg-hasen-green text-hasen-light hover:bg-hasen-green-700',
  secondary: 'bg-hasen-base text-hasen-dark hover:bg-opacity-80',
  tertiary: 'bg-hasen-dark text-hasen-light hover:bg-opacity-80',
  danger: 'bg-hasen-red text-hasen-light hover:bg-opacity-80'
}
</script>

<template>
  <button
    @click="emit('click')"
    :disabled="disabled"
    :class="[
      'px-6 py-3 w-full text-lg rounded-lg shadow-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
      variantClasses[variant]
    ]"
  >
    {{ label }}
  </button>
</template>
