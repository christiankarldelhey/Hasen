<script setup lang="ts">
import { computed, inject, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { PlayerId } from '@domain/interfaces/Player'
import type { OpponentPosition } from '@/features/Game/GameBoardDesktop.vue'
import { useHasenStore } from '@/stores/hasenStore'
import { useAudio } from '@/common/composables/useAudio'
import { useI18n } from '@/common/composables/useI18n'
import { useSocket } from '@/common/composables/useSocket'
import { useAnimationCoords } from '@/features/Animations'
import { userIdService } from '@/services/userIdService'
import BaseModal from '@/common/components/BaseModal.vue'
import ActionButton from '@/common/components/ActionButton.vue'
import MobilePlayerChip from './MobilePlayerChip.vue'
import cardBack from '@/assets/decks/card-back.png'
import {
  IconMenu2,
  IconLogout2,
  IconMusic,
  IconMusicOff,
  IconVolume,
  IconVolumeOff,
} from '@tabler/icons-vue'

const props = defineProps<{
  opponentPositions: OpponentPosition[]
}>()

const emit = defineEmits<{
  chipTap: [playerId: PlayerId]
}>()

const route = useRoute()
const router = useRouter()
const socket = useSocket()
const hasenStore = useHasenStore()
const { t } = useI18n()
const { musicEnabled, sfxEnabled, toggleMusic, toggleSfx } = useAudio()

// Mini deck: origin anchor for the deal animation
const deckEl = ref<HTMLElement | null>(null)
const coords = useAnimationCoords()
onMounted(() => coords.register('deck', deckEl))
onUnmounted(() => coords.unregister('deck'))

// During PICK_NEXT_LEAD the current player may also be a valid target
const specialCards = inject<any>('specialCards', null)
const selfId = computed(() => hasenStore.currentPlayerId)
const isSelfSelectable = computed(() => {
  const id = selfId.value
  return id ? (specialCards?.isPlayerSelectable(id) ?? false) : false
})

// Menu drawer
const menuOpen = ref(false)
const showLogoutModal = ref(false)
const gameId = computed(() => route.params.gameId as string)

const handleConfirmLogout = () => {
  const playerId = hasenStore.currentPlayerId
  const userId = userIdService.getUserId()

  if (playerId && userId && gameId.value) {
    socket.emit('game:leave-match', {
      gameId: gameId.value,
      playerId,
      userId,
    })
  }

  showLogoutModal.value = false
  router.push('/')
}
</script>

<template>
  <div class="relative flex items-center gap-2 h-full px-2 bg-black/60">
    <button
      type="button"
      class="flex items-center justify-center w-11 h-11 rounded-lg text-hasen-base shrink-0"
      :aria-label="t('game.menu')"
      @click="menuOpen = !menuOpen"
    >
      <IconMenu2 :size="22" />
    </button>

    <div class="flex-1 flex items-center justify-center gap-2 overflow-visible min-w-0">
      <MobilePlayerChip
        v-for="opponent in props.opponentPositions"
        :key="opponent.playerId"
        :player-id="opponent.playerId"
        :public-card-id="opponent.publicCardId"
        :position="opponent.position"
        @tap="emit('chipTap', opponent.playerId)"
      />
      <MobilePlayerChip
        v-if="isSelfSelectable && selfId"
        :player-id="selfId"
        @tap="emit('chipTap', selfId)"
      />
    </div>

    <!-- Mini deck (deal animation origin) -->
    <div ref="deckEl" class="relative w-9 h-12 shrink-0 mr-1">
      <div
        v-for="i in 3"
        :key="i"
        class="absolute inset-0 m-auto w-6 h-9 rounded-sm border border-hasen-dark/60"
        :style="{
          backgroundImage: `url(${cardBack})`,
          backgroundSize: 'cover',
          transform: `translate(${(i - 1) * -1}px, ${(i - 1) * 1.5}px)`,
          zIndex: 3 - i,
        }"
      />
    </div>

    <!-- Menu drawer -->
    <Transition name="drawer">
      <div
        v-if="menuOpen"
        class="absolute top-full left-2 z-40 mt-1 rounded-xl bg-hasen-base border-2 border-hasen-dark shadow-xl p-2 flex flex-col gap-1 min-w-44"
      >
        <button
          type="button"
          class="flex items-center gap-2 h-11 px-3 rounded-lg text-hasen-dark hover:bg-hasen-dark/10 text-sm"
          @click="toggleMusic()"
        >
          <IconMusic v-if="musicEnabled" :size="20" />
          <IconMusicOff v-else :size="20" />
          {{ t('audio.musicEnabled') }}
        </button>
        <button
          type="button"
          class="flex items-center gap-2 h-11 px-3 rounded-lg text-hasen-dark hover:bg-hasen-dark/10 text-sm"
          @click="toggleSfx()"
        >
          <IconVolume v-if="sfxEnabled" :size="20" />
          <IconVolumeOff v-else :size="20" />
          {{ t('audio.soundEffectsEnabled') }}
        </button>
        <button
          type="button"
          class="flex items-center gap-2 h-11 px-3 rounded-lg text-hasen-red hover:bg-hasen-dark/10 text-sm font-semibold"
          @click="showLogoutModal = true; menuOpen = false"
        >
          <IconLogout2 :size="20" />
          {{ t('lobby.leaveGame') }}
        </button>
      </div>
    </Transition>

    <!-- Drawer backdrop -->
    <div
      v-if="menuOpen"
      class="fixed inset-0 z-30"
      @click="menuOpen = false"
    />

    <BaseModal
      :isOpen="showLogoutModal"
      :title="t('game.leaveGameTitle')"
      maxWidth="sm"
      @close="showLogoutModal = false"
    >
      <p class="text-sm text-hasen-dark/80">{{ t('game.leaveGameConfirm') }}</p>
      <template #footer>
        <div class="flex gap-3">
          <ActionButton :label="t('common.cancel')" variant="secondary" @click="showLogoutModal = false" />
          <ActionButton :label="t('common.confirm')" variant="danger" @click="handleConfirmLogout" />
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
