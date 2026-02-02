<script setup lang="ts">
interface Props {
  isOpen: boolean
  title: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

withDefaults(defineProps<Props>(), {
  maxWidth: 'md'
})

const emit = defineEmits<{
  close: []
}>()

const handleBackdropClick = () => {
  emit('close')
}

const handleModalClick = (event: Event) => {
  event.stopPropagation()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div 
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        @click="handleBackdropClick"
      >
        <div 
          :class="[
            'bg-hasen-base rounded-2xl shadow-2xl p-6 m-4 w-full',
            'border-2 border-hasen-dark',
            'transform transition-all duration-300',
            {
              'max-w-sm': maxWidth === 'sm',
              'max-w-md': maxWidth === 'md',
              'max-w-lg': maxWidth === 'lg',
              'max-w-xl': maxWidth === 'xl',
              'max-w-2xl': maxWidth === '2xl'
            }
          ]"
          @click="handleModalClick"
        >
          <!-- Header -->
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-hasen-dark">{{ title }}</h2>
            <button 
              @click="emit('close')"
              class="text-hasen-dark hover:text-hasen-light transition-colors p-1 rounded-full hover:bg-hasen-dark/10"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="text-hasen-dark">
            <slot />
          </div>

          <!-- Footer (optional) -->
          <div v-if="$slots.footer" class="mt-6 pt-4 border-t border-hasen-dark/20">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .bg-hasen-base,
.modal-leave-active .bg-hasen-base {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from .bg-hasen-base {
  transform: scale(0.9);
  opacity: 0;
}

.modal-leave-to .bg-hasen-base {
  transform: scale(0.9);
  opacity: 0;
}
</style>
