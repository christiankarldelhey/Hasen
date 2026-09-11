<script setup lang="ts">
import { computed } from 'vue'
import type { PlayingCard as Card } from '@domain/interfaces'
import { useI18n } from '@/common/composables/useI18n'
import PlayingCard from '@/common/components/PlayingCard.vue'

interface Props {
  card: Card | null
  canPlay?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  play: []
}>()

const { t } = useI18n()

const suitName = computed(() =>
  props.card ? t(`suits.${props.card.suit}`) : ''
)

const specialText = computed(() => {
  if (!props.card || props.card.char !== 'S') return null
  if (props.card.suit === 'berries') return t('game.cardSpecialBerries')
  if (props.card.suit === 'leaves') return t('game.cardSpecialLeaves')
  if (props.card.suit === 'acorns') return t('game.cardSpecialAcorns')
  return null
})
</script>

<template>
  <Teleport to="body">
    <Transition name="zoom">
      <div
        v-if="props.card"
        class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 px-6"
        @click.self="emit('close')"
      >
        <PlayingCard :card="props.card" size="large" />

        <div class="mt-3 text-center max-w-[260px]">
          <p class="text-hasen-light text-base font-semibold">
            {{ props.card.char }} · {{ suitName }}
          </p>
          <p v-if="specialText" class="text-hasen-base/90 text-[13px] leading-5 mt-1">
            {{ specialText }}
          </p>
          <p v-else class="text-hasen-base/70 text-[12px] leading-4 mt-1">
            {{ t('game.cardPointsValue', { points: props.card.points }) }}
          </p>
        </div>

        <div class="flex gap-2 mt-4 w-full max-w-[260px]">
          <button
            type="button"
            class="flex-1 h-11 rounded-lg bg-hasen-dark/70 border border-hasen-base/40 text-hasen-base text-sm font-semibold"
            @click="emit('close')"
          >
            {{ t('common.close') }}
          </button>
          <button
            v-if="props.canPlay"
            type="button"
            class="flex-1 h-11 rounded-lg bg-hasen-green border border-hasen-light/40 text-hasen-light text-sm font-semibold"
            @click="emit('play')"
          >
            {{ t('game.throwCard') }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.zoom-enter-active,
.zoom-leave-active {
  transition: opacity 0.18s ease;
}
.zoom-enter-from,
.zoom-leave-to {
  opacity: 0;
}
</style>
