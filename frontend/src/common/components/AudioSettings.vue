<template>
  <div class="flex flex-col gap-4">
    <div class="form-control">
      <label class="label cursor-pointer justify-start gap-3">
        <input type="checkbox" v-model="musicEnabled" class="checkbox border-hasen-green [--chkbg:theme(colors.hasen.green)] [--chkfg:white]" />
        <span class="label-text text-black font-semibold">Music Enabled</span>
      </label>
    </div>

    <div class="form-control">
      <label class="label cursor-pointer justify-start gap-3">
        <input type="checkbox" v-model="sfxEnabled" class="checkbox border-hasen-green [--chkbg:theme(colors.hasen.green)] [--chkfg:white]" />
        <span class="label-text text-black font-semibold">Sound Effects Enabled</span>
      </label>
    </div>

    <div class="form-control">
      <span class="label-text text-black font-semibold block mb-2">Master Volume</span>
      <input 
        type="range" 
        min="0" 
        max="1" 
        step="0.01" 
        v-model.number="masterVolume"
        class="range range-primary w-full"
      />
    </div>

    <div class="form-control">
      <span class="label-text text-black font-semibold block mb-2">Music Volume</span>
      <input 
        type="range" 
        min="0" 
        max="1" 
        step="0.01" 
        v-model.number="musicVolume"
        :disabled="!musicEnabled"
        class="range range-primary w-full"
      />
    </div>

    <div class="form-control">
      <span class="label-text text-black font-semibold block mb-2">FX Volume</span>
      <input 
        type="range" 
        min="0" 
        max="1" 
        step="0.01" 
        v-model.number="sfxVolume"
        :disabled="!sfxEnabled"
        class="range range-primary w-full"
      />
    </div>


  </div>
</template>

<script setup lang="ts">
import { useAudio } from '../composables/useAudio';

const {
  masterVolume,
  musicVolume,
  sfxVolume,
  musicEnabled,
  sfxEnabled,
} = useAudio();
</script>

<style scoped>
.range {
    height: 1rem;
}
.range-primary {
    color: var(--color-hasen-green);
    --range-thumb: var(--color-hasen-green);
}
</style>
