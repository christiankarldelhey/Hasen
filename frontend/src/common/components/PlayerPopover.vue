<script setup lang="ts">
import { ref } from 'vue'
import PlayerInfo from '@/common/components/PlayerInfo.vue'
import PlayerBids from '@/features/Bids/PlayerBids.vue'
import type { PlayerId } from '@domain/interfaces/Player'

interface Props {
  playerId: PlayerId
  position?: 'top' | 'bottom' | 'left' | 'right'
  disableHover?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disableHover: false
})
const showPopover = ref(false)
</script>

<template>
  <div 
    class="relative"
    @mouseenter="!disableHover && (showPopover = true)"
    @mouseleave="showPopover = false"
  >
    <PlayerInfo :player-id="playerId" :position="position" />
    
    <Transition name="fade">
      <div 
        v-if="showPopover"
        :class="[
          'absolute z-50',
          position === 'top' ? 'top-full mb-2 left-1/2 -translate-x-1/2' : '',
          position === 'left' ? 'left-full mr-2 top-1/2 -translate-y-1/2' : '',
          position === 'right' ? 'right-full ml-2 top-1/2 -translate-y-1/2' : ''
        ]"
      >
        <div class="relative rounded-lg  p-0">
          <!-- Pointer -->
          <div 
            :class="[
              'absolute w-0 h-0 bg-hasen-dark',
              position === 'top' ? 'bottom-full left-1/2 -translate-y-1/2 border-l-transparent border-r-transparent border-b-transparent' : '',
              position === 'bottom' ? 'top-full left-1/2 -translate-y-1/2 border-l-transparent border-r-transparent border-t-transparent' : '',
              position === 'left' ? 'right-full top-1/2 -translate-x-1/2 border-t-transparent border-b-transparent border-r-transparent' : '',
              position === 'right' ? 'left-full top-1/2 -translate-x-1/2 border-t-transparent border-b-transparent border-l-transparent' : ''
            ]"
          />
          <PlayerBids :player-id="playerId" />
        </div>
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
