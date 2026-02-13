<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GameScores from './GameScores.vue'
import Deck from './Deck.vue'
import GamePanel from '@/common/components/GamePanel.vue'
import BaseModal from '@/common/components/BaseModal.vue'
import ActionButton from '@/common/components/ActionButton.vue'
import { useAudio } from '@/common/composables/useAudio'
import { useSocket } from '@/common/composables/useSocket'
import { useHasenStore } from '@/stores/hasenStore'
import { userIdService } from '@/services/userIdService'
import { IconLogout2, IconMusic, IconMusicOff, IconVolume, IconVolumeOff } from '@tabler/icons-vue'

const route = useRoute()
const router = useRouter()
const socket = useSocket()
const hasenStore = useHasenStore()

const { musicEnabled, sfxEnabled, toggleMusic, toggleSfx } = useAudio()

const showLogoutModal = ref(false)

const gameId = computed(() => route.params.gameId as string)

const handleLogoutClick = () => {
  showLogoutModal.value = true
}

const handleCancelLogout = () => {
  showLogoutModal.value = false
}

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
<div class="fixed top-0 left-0 z-10 m-4 flex flex-row gap-1">
  <GamePanel class="flex flex-col justify-around gap-2">
    <button class="cursor-pointer rounded-full p-1 transition-colors hover:bg-hasen-dark/10" @click="handleLogoutClick">
      <IconLogout2 :size="22" class="text-hasen-base" />
    </button>

    <button class="cursor-pointer rounded-full p-1 transition-colors hover:bg-hasen-dark/10" @click="toggleMusic()">
      <IconMusic v-if="musicEnabled" :size="22" class="text-hasen-base" />
      <IconMusicOff v-else :size="22" class="text-hasen-base" />
    </button>

    <button class="cursor-pointer rounded-full p-1 transition-colors hover:bg-hasen-dark/10" @click="toggleSfx()">
      <IconVolume v-if="sfxEnabled" :size="22" class="text-hasen-base" />
      <IconVolumeOff v-else :size="22" class="text-hasen-base" />
    </button>
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

<BaseModal :isOpen="showLogoutModal" title="Leave game?" maxWidth="sm" @close="handleCancelLogout">
  <p class="text-sm text-hasen-dark/80">Are you sure you want to leave the game?</p>

  <template #footer>
    <div class="flex gap-3">
      <ActionButton label="Cancel" variant="secondary" @click="handleCancelLogout" />
      <ActionButton label="Confirm" variant="danger" @click="handleConfirmLogout" />
    </div>
  </template>
</BaseModal>
</template>
