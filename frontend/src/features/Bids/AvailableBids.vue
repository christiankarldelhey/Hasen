<script setup lang="ts">
import { computed, watch } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useHasenStore } from '@/stores/hasenStore'
import { useBidValidation } from '@/features/Bids/composables/useBidValidation'
import Bid from './Bid.vue'
import { useI18n } from '@/common/composables/useI18n'
import GamePanel from '@/common/components/GamePanel.vue'

const gameStore = useGameStore()
const hasenStore = useHasenStore()
const { t } = useI18n()

const game = computed(() => gameStore.publicGameState)
const playerId = computed(() => hasenStore.currentPlayerId || null)

const { isBidDisabled, getBidDisabledReason } = useBidValidation(game, playerId)

const roundBids = computed(() => {
  const allBids = gameStore.publicGameState?.round.roundBids.bids || []
  
  return {
    pointsBids: allBids.filter(b => b.bid_type === 'points'),
    setCollectionBids: allBids.filter(b => b.bid_type === 'set_collection'),
    trickBids: allBids.filter(b => b.bid_type === 'trick')
  }
})

watch(roundBids, (newVal) => {
  console.log('🎯 BidsPanel - roundBids:', newVal)
}, { immediate: true })
</script>

<template>
  <GamePanel class="fixed top-0 right-0 z-10 m-4">
    <div v-if="roundBids" class="flex flex-col gap-2">
      <div class="flex flex-row">
        <span class="text-hasen-base text-sm">{{ t('game.availableBids') }}</span>
      </div>
      <!-- Fila de Tricks / tricks (2 bids) -->
      <div class="flex flex-row gap-2">
        <Bid 
          v-for="(bid, index) in roundBids.trickBids"
          :key="`trick-${index}`"
          :bid="bid"
          type="trick"
          :disabled="isBidDisabled('trick', bid)"
          :disabled-reason="getBidDisabledReason('trick', bid)"
        />
      </div>

      <!-- Fila de Points (2 bids) -->
      <div class="flex flex-row gap-2">
        <Bid 
          v-for="(bid, index) in roundBids.pointsBids"
          :key="`points-${index}`"
          :bid="bid"
          type="points"
          :disabled="isBidDisabled('points', bid)"
          :disabled-reason="getBidDisabledReason('points', bid)"
        />
      </div>

      <!-- Fila de Set Collection / set collection (2 bids) -->
      <div class="flex flex-row gap-2">
        <Bid 
          v-for="(bid, index) in roundBids.setCollectionBids"
          :key="`set-collection-${index}`"
          :bid="bid"
          type="set_collection"
          :disabled="isBidDisabled('set_collection', bid)"
          :disabled-reason="getBidDisabledReason('set_collection', bid)"
        />
      </div>

    </div>
    <div v-else class="bg-red-500 text-white p-2 rounded">
      No round bids data
    </div>
  </GamePanel>
</template>
