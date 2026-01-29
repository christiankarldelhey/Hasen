<script setup lang="ts">
import { ref } from 'vue'
import PlayerInfo from '@/common/components/PlayerInfo.vue'
import PlayerBidScore from '@/features/Bids/PlayerBidScore.vue'
import type { PlayerId } from '@domain/interfaces/Player'

interface Props {
  playerId: PlayerId
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const props = defineProps<Props>()
const showPopover = ref(false)
</script>

<template>
  <div 
    class="relative"
    @mouseenter="showPopover = true"
    @mouseleave="showPopover = false"
  >
    <PlayerInfo :player-id="playerId" :position="position" />
    
    <Transition name="fade">
      <div 
        v-if="showPopover"
        class="absolute z-50 mt-2 left-1/2 -translate-x-1/2"
      >
        <PlayerBidScore :player-id="playerId" />
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
