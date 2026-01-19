<script setup lang="ts">
import { ref } from 'vue'
import { type PlayerId } from '@domain/interfaces/Player'
import OtherPlayerScore from '@/features/Players/OtherPlayerScore.vue'
import Hare from '@/common/components/Hare.vue'

interface Props {
  playerId: PlayerId
}

const props = defineProps<Props>()
const showPopover = ref(false)

const hardcodedScore = 28
</script>

<template>
  <div 
    class="relative"
    @mouseenter="showPopover = true"
    @mouseleave="showPopover = false"
  >
    <div class="flex flex-col items-center justify-center bg-black/30 rounded-full p-3 cursor-pointer">
      <Hare :player-id="playerId" />
      
      <div class="flex items-center gap-1 mt-1">
        <span class="text-lg">⭐</span>
        <span class="text-white text-sm font-semibold">{{ hardcodedScore }}</span>
      </div>
    </div>

    <Transition name="fade">
      <div 
        v-if="showPopover"
        class="absolute z-50 mt-2 left-1/2 -translate-x-1/2"
      >
        <OtherPlayerScore :player-id="playerId" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
