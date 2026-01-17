<script setup lang="ts">
interface Props {
  label: string
  disabled?: boolean
  variant?: 'primary' | 'secondary'
}

withDefaults(defineProps<Props>(), {
  disabled: false,
  variant: 'primary'
})

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    @click="emit('click')"
    :disabled="disabled"
    :class="[
      'px-6 py-3 font-bold rounded-lg shadow-lg transition-colors',
      variant === 'primary' 
        ? 'bg-hasen-green text-white hover:bg-hasen-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
        : 'bg-gray-600 text-white hover:bg-gray-700'
    ]"
  >
    {{ label }}
  </button>
</template>
