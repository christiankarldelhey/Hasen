<script setup lang="ts">
import { ref } from 'vue'
import { type PlayerId } from '@domain/interfaces/Player'
import PlayerBidScore from '@/features/Bids/PlayerBidScore.vue'
import PlayerGameScore from '@/features/Score/PlayerGameScore.vue'
import Hare from '@/common/components/Hare.vue'

interface Props {
  playerId: PlayerId
  layout?: 'circular' | 'row'
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'circular'
})
const showPopover = ref(false)
</script>

<template>
  <!-- Circular layout for other players -->
  <div 
    v-if="layout === 'circular'"
    class="relative"
    @mouseenter="showPopover = true"
    @mouseleave="showPopover = false"
  >
    <div class="flex flex-col items-center justify-center bg-black/30 rounded-full p-3 cursor-pointer">
      <Hare :player-id="playerId" />
      
      <div class="mt-1">
        <PlayerGameScore :player-id="playerId" size="small" />
      </div>
    </div>

    <Transition name="fade">
      <div 
        v-if="showPopover"
        class="absolute z-50 mt-2 left-1/2 -translate-x-1/2 w-[400px]"
      >
        <PlayerBidScore :player-id="playerId" />
      </div>
    </Transition>
  </div>

  <!-- Row layout for current player -->
  <div 
    v-else
    class="flex items-center gap-2 bg-black/30 rounded-lg px-4 py-2"
  >
    <Hare :player-id="playerId" />
    <PlayerGameScore :player-id="playerId" size="large" />
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
