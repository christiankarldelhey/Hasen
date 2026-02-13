<script setup lang="ts">
import GameScores from './GameScores.vue'
import Deck from './Deck.vue'
import GamePanel from '@/common/components/GamePanel.vue'
import {IconDoor,IconMusic, IconMusicOff, IconVolume, IconVolumeOff} from '@tabler/icons-vue'


</script>

<template>
<div class="fixed top-0 left-0 z-10 m-4 flex flex-row gap-1">
  <GamePanel class="flex flex-col justify-around gap-2">
    <IconDoor :size="22" class="text-hasen-base" /> 
    <IconMusic :size="22" class="text-hasen-base" /> 
    <IconVolume :size="22" class="text-hasen-base" />
  </GamePanel>
  <GamePanel class="">
    <div class="flex flex-col gap-1">
      <div class="flex flex-row gap-2">
        <div class="flex flex-col gap-1">
          <Deck />
        </div>
        <GameScores />
      </div>
    </div>
  </GamePanel>
</div>
</template>
