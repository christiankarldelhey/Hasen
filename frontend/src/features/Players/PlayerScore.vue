<script setup lang="ts">
import { computed } from 'vue'
import type { TrickNumber } from '@domain/interfaces/Trick'
import { useGameStore } from '@/stores/gameStore'
import { useHasenStore } from '@/stores/hasenStore'
import AcornSymbol from '@/assets/symbols/acorn.png'
import BerrySymbol from '@/assets/symbols/berry.png'
import LeaveSymbol from '@/assets/symbols/leave.png'
import TrickSymbol from '@/assets/symbols/trick.png'
import PointsToWin from '@/features/Bids/PointsToWin.vue'

const gameStore = useGameStore()
const hasenStore = useHasenStore()

const playerRoundScore = computed(() => {
  const roundScore = gameStore.publicGameState?.round.roundScore || []
  const currentPlayerId = hasenStore.currentPlayerId
  return roundScore.find((score) => score.playerId === currentPlayerId)
})

const points = computed(() => playerRoundScore.value?.points ?? 0)

const setCollection = computed(() => playerRoundScore.value?.setCollection ?? {
  acorns: 0,
  leaves: 0,
  berries: 0,
  flowers: 0
})

const tricksWon = computed(() => playerRoundScore.value?.tricksWon ?? [])

const trickNumbers: TrickNumber[] = [1, 2, 3, 4, 5]
</script>

<template>
  <div class="bg-hasen-base rounded-lg p-2 h-[150px] flex flex-col shadow-lg">

    <!-- Row: Tricks Won -->
    <div class="flex-1 flex flex-row items-center gap-1">
      <div class="flex flex-row items-center gap-1">
        <div v-for="trickNum in trickNumbers" :key="trickNum" class="relative w-7 h-9 flex-none">
          <span 
            class="absolute inset-0 left-1 text-hasen-dark text-xl font-semibold z-10"
            :class="tricksWon.includes(trickNum) ? 'opacity-100' : 'opacity-30'"
          >
            {{ trickNum }}
          </span>
          <img
            class="absolute inset-0 h-9 w-7"
            :src="TrickSymbol"
            alt="trick symbol"
            :class="tricksWon.includes(trickNum) ? 'opacity-100' : 'opacity-30'"
          />
        </div>
      </div>
    </div>

    <!-- Row: Set Collection -->
    <div class="flex-1 flex flex-row items-center gap-1">
      <div class="flex flex-row items-center gap-1">
        <img :src="AcornSymbol" alt="acorns" class="h-9 opacity-70" />
        <span class="text-hasen-dark text-lg font-semibold pr-2">{{ setCollection.acorns }}</span>
        <img :src="LeaveSymbol" alt="leaves" class="h-9 opacity-70" />
        <span class="text-hasen-dark text-lg font-semibold pr-2">{{ setCollection.leaves }}</span>
        <img :src="BerrySymbol" alt="berries" class="h-9 opacity-70" />
        <span class="text-hasen-dark text-lg font-semibold pr-2">{{ setCollection.berries }}</span>
      </div>
    </div>

    <!-- Row: Points -->
    <div class="flex-1 flex flex-row items-center justify-between">
      <span class="text-hasen-dark text-lg font-semibold opacity-30">0</span>
      <PointsToWin size="small" :points="points" />
      <span class="text-hasen-dark text-lg font-semibold opacity-30">100</span>
    </div>
  </div>
</template>
