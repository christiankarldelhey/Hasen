<script setup lang="ts">
import { computed, inject, ref, onMounted, onUnmounted } from 'vue'
import type { PlayingCard as Card, TrickState } from '@domain/interfaces'
import { usePlayers } from '@/features/Players/composables/usePlayers'
import { useTurnMessage } from '@/features/Players/composables/useTurnMessage'
import { useAnimationCoords } from '@/features/Animations'
import { useLongPress } from '@/common/composables/useLongPress'
import { useCssPxVar } from '@/common/composables/useCssPxVar'
import PlayingCard from '@/common/components/PlayingCard.vue'

interface Props {
  cards: Card[]
  winningCardId?: string | null
  trickState?: TrickState | null
  selectedStealCardId?: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  tapCard: [card: Card]
  longPressCard: [card: Card]
  backgroundTap: []
}>()

const { getPlayerNameById } = usePlayers()
const { shouldShow, turnMessage } = useTurnMessage()

const trickEl = ref<HTMLElement | null>(null)
const coords = useAnimationCoords()
onMounted(() => coords.register('trick', trickEl))
onUnmounted(() => coords.unregister('trick'))

const specialCards = inject<any>('specialCards', null)

const isCardSelectable = (cardId: string) =>
  specialCards?.isCardSelectable(cardId) ?? false

const ownerName = (card: Card): string => {
  const name = card.owner ? getPlayerNameById.value(card.owner) : undefined
  return (name || '—').slice(0, 8)
}

const cardW = useCssPxVar('--m-card-trick-w', 80)
const PEEK = 52

// Timestamp del último long-press: compartido entre los press handlers para
// suprimir taps espurios si las posiciones se recomputan a mitad del gesto.
let lastLongPressAt = 0

const makePress = (card: Card) =>
  useLongPress(
    () => {
      lastLongPressAt = Date.now()
      emit('longPressCard', card)
    },
    () => {
      if (Date.now() - lastLongPressAt < 600) return
      emit('tapCard', card)
    }
  )

const cardPositions = computed(() => {
  const n = props.cards.length
  const totalW = cardW.value + Math.max(0, n - 1) * PEEK

  return props.cards.map((card, index) => {
    const isWinning =
      props.trickState === 'resolve' &&
      !!props.winningCardId &&
      card.id === props.winningCardId
    const isStealTarget = props.selectedStealCardId === card.id
    const selectable = isCardSelectable(card.id)

    return {
      card,
      left: index * PEEK - totalW / 2,
      lift: isStealTarget ? -14 : isWinning ? -10 : 0,
      rotation: 0,
      zIndex: isStealTarget ? 30 : isWinning ? 20 : index,
      isWinning,
      isStealTarget,
      selectable,
      owner: ownerName(card),
      press: makePress(card),
    }
  })
})
</script>

<template>
  <div
    class="relative flex flex-col items-center justify-center gap-1 overflow-hidden px-3"
    @click.self="emit('backgroundTap')"
  >
    <!-- Cards row -->
    <div ref="trickEl" class="relative h-[150px] w-full" @click.self="emit('backgroundTap')">
      <template v-if="cardPositions.length > 0">
        <div
          v-for="pos in cardPositions"
          :key="pos.card.id"
          class="absolute top-0 left-1/2 transition-transform duration-200 ease-out"
          :style="{
            transform: `translateX(${pos.left}px) translateY(${pos.lift}px)`,
            zIndex: pos.zIndex,
          }"
          v-bind="pos.press"
        >
          <div
            :class="[
              'relative rounded-lg',
              pos.isWinning ? 'ring-4 ring-hasen-green' : '',
              pos.isStealTarget ? 'ring-4 ring-yellow-400' : '',
              pos.selectable && !pos.isStealTarget ? 'ring-2 ring-yellow-400/80 animate-pulse' : '',
            ]"
          >
            <PlayingCard :card="pos.card" size="mobileTrick" />
          </div>
          <div class="text-center text-[11px] leading-4 text-hasen-base/90 truncate w-[52px] mx-auto mt-0.5">
            {{ pos.owner }}
          </div>
        </div>
      </template>
    </div>

    <!-- Status line -->
    <div v-if="shouldShow && turnMessage" class="text-center px-2 pointer-events-none">
      <p class="text-[13px] leading-4 font-semibold text-hasen-light truncate">
        {{ turnMessage.title }}
      </p>
      <p class="text-[11px] leading-4 text-hasen-base/80 truncate">
        {{ turnMessage.subtitle }}
      </p>
    </div>
  </div>
</template>
