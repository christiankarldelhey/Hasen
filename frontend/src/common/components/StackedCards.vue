<script setup lang="ts">
import { computed } from 'vue'
import cardBack from '@/assets/decks/card-back.png'
import OtherPlayerInfo from '@/common/components/OtherPlayerInfo.vue'
import PlayingCard from '@/common/components/PlayingCard.vue'
import type { PlayerId } from '@domain/interfaces/Player'
import type { PlayingCard as DomainPlayingCard } from '@domain/interfaces'


interface Props {
  count: number
  playerId: PlayerId
  showHare?: boolean
  publicCard?: DomainPlayingCard
}

const props = withDefaults(defineProps<Props>(), {
  showHare: true,
  publicCard: null as DomainPlayingCard | null,
})

const stackedCards = computed(() => {
  return Array.from({ length: props.count }, (_, index) => index)
})

const stackedCardsWidth = computed(() => {
  return props.count > 0 ? 90 + (props.count - 1) * 18 : 0
})
</script>

<template>
  <div 
    class="relative flex h-[150px]"
    :style="{ width: `${stackedCardsWidth}px` }"
  >
    <div v-if="publicCard" class="flex justify-center z-10">
      <PlayingCard :card="publicCard" size="small" />
    </div>

    <div 
      v-for="(_, index) in stackedCards" 
      :key="index"
      class="absolute rounded-lg w-[90px] h-[150px]"
      :style="{
        backgroundImage: `url(${cardBack})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transform: `translate(${index * 18}px, 0px)`,
        zIndex: count - index
      }"
    />
  </div>
</template>
