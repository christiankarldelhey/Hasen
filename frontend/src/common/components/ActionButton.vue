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
  primary: 'bg-hasen-green text-white hover:bg-hasen-green-700',
  secondary: 'bg-hasen-base text-hasen-dark hover:bg-opacity-80',
  tertiary: 'bg-hasen-dark text-white hover:bg-opacity-80',
  danger: 'bg-hasen-red text-white hover:bg-opacity-80'
}
</script>

<template>
  <button
    @click="emit('click')"
    :disabled="disabled"
    :class="[
      'px-6 py-3 w-full font-semibold rounded-lg shadow-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
      variantClasses[variant]
    ]"
  >
    {{ label }}
  </button>
</template>
