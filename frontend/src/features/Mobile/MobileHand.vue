<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { PlayingCard as Card } from '@domain/interfaces'
import { useAnimationCoords } from '@/features/Animations'
import { useLongPress } from '@/common/composables/useLongPress'
import { useCssPxVar } from '@/common/composables/useCssPxVar'
import PlayingCard from '@/common/components/PlayingCard.vue'

interface Props {
  cards: Card[]
  mode?: 'normal' | 'card_replacement'
  selectedCardId?: string | null
  isDisabled?: (card: Card) => boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'normal',
  selectedCardId: null,
})

const emit = defineEmits<{
  tapCard: [card: Card]
  longPressCard: [card: Card]
}>()

const handEl = ref<HTMLElement | null>(null)
const coords = useAnimationCoords()
onMounted(() => coords.register('player-hand', handEl))
onUnmounted(() => coords.unregister('player-hand'))

// Measure available width to compute the overlap (peek)
const containerWidth = ref(360)
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (handEl.value) {
    containerWidth.value = handEl.value.clientWidth
    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) containerWidth.value = entry.contentRect.width
    })
    resizeObserver.observe(handEl.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

const cardW = useCssPxVar('--m-card-hand-w', 72)

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
  if (n === 0) return []

  const maxPeek = 46
  const minPeek = 30
  const available = containerWidth.value - 24 // horizontal padding
  const peek =
    n > 1
      ? Math.max(minPeek, Math.min(maxPeek, (available - cardW.value) / (n - 1)))
      : 0
  const totalW = cardW.value + (n - 1) * peek

  return props.cards.map((card, index) => {
    const selected = props.selectedCardId === card.id
    const norm = n === 1 ? 0 : index / (n - 1) - 0.5

    return {
      card,
      left: index * peek + (containerWidth.value - totalW) / 2,
      y: selected ? -28 : Math.abs(norm) * 6,
      rotation: selected ? 0 : norm * 10,
      zIndex: selected ? 50 : index,
      selected,
      disabled: props.isDisabled?.(card) ?? false,
      // En modo reemplazo, las cartas ocultas (no deshabilitadas) son seleccionables
      replaceable: props.mode === 'card_replacement' && card.state === 'in_hand_hidden',
      press: makePress(card),
    }
  })
})
</script>

<template>
  <div
    ref="handEl"
    data-tutorial-id="player-hand"
    class="relative h-full overflow-visible touch-none select-none"
  >
    <div
      v-for="pos in cardPositions"
      :key="pos.card.id"
      class="absolute bottom-4 transition-all duration-200 ease-out"
      :style="{
        left: `${pos.left}px`,
        transform: `translateY(${pos.y}px) rotate(${pos.rotation}deg)`,
        transformOrigin: 'center bottom',
        zIndex: pos.zIndex,
      }"
      v-bind="pos.press"
    >
      <div
        :class="[
          'relative rounded-lg',
          pos.selected ? 'ring-4 ring-yellow-400' : '',
          pos.replaceable && !pos.selected ? 'ring-2 ring-hasen-light/70' : '',
          pos.disabled ? 'opacity-45' : '',
        ]"
      >
        <PlayingCard :card="pos.card" size="mobile" />
      </div>
    </div>
  </div>
</template>
