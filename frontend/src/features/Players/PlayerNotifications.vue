<script setup lang="ts">
import { useTurnMessage } from './composables/useTurnMessage'

const { shouldShow, turnMessage, isMyTurn } = useTurnMessage()
</script>

<template>
  <div v-if="shouldShow">
    <div 
      class="rounded-lg px-8 py-4 shadow-lg transition-colors duration-300 w-full"
      :class="isMyTurn ? 'bg-hasen-base' : 'bg-hasen-base'">
      <div class="text-hasen-dark">
        <p class="font-bold text-lg">{{ turnMessage?.title }}</p>
        <p class="text-sm opacity-90">{{ turnMessage?.subtitle }}</p>
      </div>
    </div>
  </div>
</template>
