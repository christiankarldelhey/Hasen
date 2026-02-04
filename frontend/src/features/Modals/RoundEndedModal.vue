<script setup lang="ts">
import { computed, ref } from 'vue'
import { AVAILABLE_PLAYERS, type PlayerId } from '@domain/interfaces/Player'
import type { Round } from '@domain/interfaces/Round'
import type { Bid, PlayerBidEntry } from '@domain/interfaces/Bid'
import { isWinningBid } from '@domain/rules/BidRules'
import BaseModal from '@/common/components/BaseModal.vue'
import PlayerAvatar from '@/common/components/PlayerAvatar.vue'
import BidWinCondition from '@/features/Bids/BidWinCondition.vue'

interface Props {
  isOpen: boolean
  round: Round | null
  readyPlayers?: PlayerId[]
  totalPlayers?: number
}

const props = withDefaults(defineProps<Props>(), {
  readyPlayers: () => [],
  totalPlayers: 0
})

const emit = defineEmits<{
  close: []
  continue: []
}>()

const isWaiting = ref(false)

const handleContinue = () => {
  isWaiting.value = true
  emit('continue')
}

const handleClose = () => {
  // Si el jugador cierra el modal (click fuera o X), también cuenta como "continue"
  // para evitar que quede trabado esperando
  if (!isWaiting.value) {
    handleContinue()
  }
  emit('close')
}

const isPlayerReady = (playerId: PlayerId) => {
  return props.readyPlayers.includes(playerId)
}

interface PlayerBidInfo {
  playerId: PlayerId
  playerName: string
  playerColor: string
  bids: {
    bid: Bid
    bidEntry: PlayerBidEntry
    isWinning: boolean | null
    score: number
  }[]
  totalScore: number
}

const playerBidsInfo = computed<PlayerBidInfo[]>(() => {
  if (!props.round) return []

  const playersInfo: PlayerBidInfo[] = []

  AVAILABLE_PLAYERS.forEach(player => {
    const playerBidEntries = props.round!.roundBids.playerBids[player.id] || []
    const playerRoundScore = props.round!.roundScore.find(s => s.playerId === player.id)
    
    if (!playerRoundScore) return

    const bidsInfo = playerBidEntries.map(bidEntry => {
      const bid = props.round!.roundBids.bids.find(b => b.bid_id === bidEntry.bidId)
      if (!bid) return null

      const isWinning = isWinningBid(bid, playerRoundScore, true)
      let score = 0

      if (isWinning === true) {
        if (bid.bid_type === 'set_collection') {
          const condition = bid.win_condition as import('@domain/interfaces/Bid').SetCollectionBidCondition
          const winSuitCount = playerRoundScore.setCollection[condition.win_suit]
          const avoidSuitCount = playerRoundScore.setCollection[condition.avoid_suit]
          const penaltyPerCard = Math.abs(bidEntry.onLose)
          score = (winSuitCount * 10) - (avoidSuitCount * penaltyPerCard)
        } else {
          score = bid.bid_score
        }
      } else if (isWinning === false) {
        if (bid.bid_type === 'set_collection') {
          const condition = bid.win_condition as import('@domain/interfaces/Bid').SetCollectionBidCondition
          const winSuitCount = playerRoundScore.setCollection[condition.win_suit]
          const avoidSuitCount = playerRoundScore.setCollection[condition.avoid_suit]
          const penaltyPerCard = Math.abs(bidEntry.onLose)
          const netPoints = (winSuitCount * 10) - (avoidSuitCount * penaltyPerCard)
          
          if (netPoints >= -9 && netPoints <= 9) {
            score = -10
          } else {
            score = netPoints
          }
        } else {
          score = bidEntry.onLose
        }
      }

      return {
        bid,
        bidEntry,
        isWinning,
        score
      }
    }).filter(b => b !== null) as any[]

    // Si el jugador NO hizo apuestas, usar card points como fallback
    // Si hizo apuestas, solo sumar bid scores
    const totalScore = playerBidEntries.length === 0 
      ? playerRoundScore.points 
      : bidsInfo.reduce((sum, b) => sum + b.score, 0)

    playersInfo.push({
      playerId: player.id,
      playerName: player.name,
      playerColor: player.color,
      bids: bidsInfo,
      totalScore
    })
  })

  return playersInfo.sort((a, b) => b.totalScore - a.totalScore)
})
</script>

<template>
  <BaseModal :isOpen="isOpen" :title="isWaiting ? 'Waiting for Players' : 'Round Ended'" maxWidth="2xl" @close="handleClose">
    <!-- Estado: Mostrando resultados -->
    <div v-if="!isWaiting" class="space-y-4">
      <!-- Player Results -->
      <div v-for="playerInfo in playerBidsInfo" :key="playerInfo.playerId" class="space-y-2">
        <!-- Player Header -->
        <div class="flex items-center gap-3 pb-2 border-b border-hasen-dark/20">
          <PlayerAvatar :playerId="playerInfo.playerId" size="small" />
          <div class="flex-1">
            <h3 class="font-bold text-lg">{{ playerInfo.playerName }}</h3>
            <p class="text-sm text-hasen-dark/70">
              Total Score: <span class="font-bold" :style="{ color: playerInfo.playerColor }">{{ playerInfo.totalScore }}</span>
            </p>
          </div>
        </div>

        <!-- Player Bids -->
        <div v-if="playerInfo.bids.length > 0" class="space-y-2 pl-4">
          <div 
            v-for="(bidInfo, index) in playerInfo.bids" 
            :key="index"
            class="flex items-center justify-between p-2 rounded-lg bg-hasen-dark/5"
          >
            <div class="flex items-center gap-2 flex-1">
              <BidWinCondition 
                :type="bidInfo.bid.bid_type" 
                :win_condition="bidInfo.bid.win_condition"
              />
            </div>
            <div class="flex items-center gap-2">
              <span 
                :class="[
                  'font-bold text-sm px-2 py-1 rounded',
                  bidInfo.isWinning === true ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'
                ]"
              >
                {{ bidInfo.isWinning === true ? '✓' : '✗' }}
                {{ bidInfo.score > 0 ? '+' : '' }}{{ bidInfo.score }}
              </span>
            </div>
          </div>
        </div>

        <!-- No Bids Message -->
        <div v-else class="pl-4 text-sm text-hasen-dark/50 italic">
          No bids made
        </div>
      </div>
    </div>

    <!-- Estado: Esperando jugadores -->
    <div v-else class="space-y-6 py-4">
      <div class="text-center">
        <p class="text-lg text-hasen-dark/70 mb-2">Waiting for other players...</p>
        <p class="text-sm font-bold text-hasen-dark">{{ readyPlayers.length }} / {{ totalPlayers }} players ready</p>
      </div>

      <!-- Lista de jugadores con estado ready -->
      <div class="grid grid-cols-2 gap-4">
        <div 
          v-for="player in AVAILABLE_PLAYERS.slice(0, totalPlayers)" 
          :key="player.id"
          class="flex items-center gap-3 p-3 rounded-lg bg-hasen-dark/5"
        >
          <PlayerAvatar :playerId="player.id" size="small" />
          <div class="flex-1">
            <p class="font-semibold text-sm">{{ player.name }}</p>
          </div>
          <div class="text-2xl">
            {{ isPlayerReady(player.id) ? '✓' : '⏳' }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <button 
          v-if="!isWaiting"
          @click="handleContinue"
          class="px-6 py-2 bg-hasen-green text-white rounded-lg font-semibold hover:bg-hasen-green/90 transition-colors"
        >
          Continue
        </button>
        <div v-else class="text-sm text-hasen-dark/50 italic">
          Waiting for all players to continue...
        </div>
      </div>
    </template>
  </BaseModal>
</template>
