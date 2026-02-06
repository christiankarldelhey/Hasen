<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import cardBack from '@/assets/decks/card-back.png'
import type { AnimatedCard } from '../composables/useDealAnimation'

interface Props {
  cards: AnimatedCard[]
}

interface FlyingCard {
  id: string
  left: number
  top: number
  dx: number
  dy: number
  delay: number
  duration: number
}

const props = defineProps<Props>()

const cardWidth = 90
const cardHeight = 150
const flyingCards = ref<FlyingCard[]>([])
let styleEl: HTMLStyleElement | null = null

watch(() => props.cards, (newCards) => {
  if (newCards.length === 0) {
    flyingCards.value = []
    if (styleEl) {
      styleEl.remove()
      styleEl = null
    }
    return
  }

  const cards: FlyingCard[] = []
  let keyframes = ''

  for (const card of newCards) {
    const left = card.startX - cardWidth / 2
    const top = card.startY - cardHeight / 2
    const dx = card.endX - card.startX
    const dy = card.endY - card.startY
    const safeId = card.id.replace(/[^a-zA-Z0-9-]/g, '')

    cards.push({ id: card.id, left, top, dx, dy, delay: card.delay, duration: card.duration })

    keyframes += `
      @keyframes fly-${safeId} {
        0% { transform: translate(0, 0); opacity: 1; }
        85% { opacity: 1; }
        100% { transform: translate(${dx}px, ${dy}px); opacity: 0; }
      }
    `
  }

  if (styleEl) styleEl.remove()
  styleEl = document.createElement('style')
  styleEl.textContent = keyframes
  document.head.appendChild(styleEl)

  flyingCards.value = cards
})

onUnmounted(() => {
  if (styleEl) {
    styleEl.remove()
    styleEl = null
  }
})
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 pointer-events-none" style="z-index: 9999;">
      <div
        v-for="card in flyingCards"
        :key="card.id"
        class="absolute rounded-lg"
        :style="{
          width: `${cardWidth}px`,
          height: `${cardHeight}px`,
          backgroundImage: `url(${cardBack})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          left: `${card.left}px`,
          top: `${card.top}px`,
          opacity: 0,
          animation: `fly-${card.id.replace(/[^a-zA-Z0-9-]/g, '')} ${card.duration}ms ease-out ${card.delay}ms forwards`,
        }"
      />
    </div>
  </Teleport>
</template>
