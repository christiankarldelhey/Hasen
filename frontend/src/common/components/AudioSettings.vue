<template>
  <div class="audio-settings">
    <h3>Audio Settings</h3>
    
    <div class="setting-group">
      <label>
        <input type="checkbox" v-model="musicEnabled" />
        Music Enabled
      </label>
    </div>

    <div class="setting-group">
      <label>
        <input type="checkbox" v-model="sfxEnabled" />
        Sound Effects Enabled
      </label>
    </div>

    <div class="setting-group">
      <label>
        Master Volume: {{ Math.round(masterVolume * 100) }}%
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          v-model.number="masterVolume" 
        />
      </label>
    </div>

    <div class="setting-group">
      <label>
        Music Volume: {{ Math.round(musicVolume * 100) }}%
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          v-model.number="musicVolume"
          :disabled="!musicEnabled"
        />
      </label>
    </div>

    <div class="setting-group">
      <label>
        SFX Volume: {{ Math.round(sfxVolume * 100) }}%
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          v-model.number="sfxVolume"
          :disabled="!sfxEnabled"
        />
      </label>
    </div>

    <div class="setting-group">
      <button @click="testSfx">Test Sound Effect</button>
    </div>

    <div v-if="currentTrack" class="current-track">
      Now Playing: {{ currentTrack }}
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
  currentTrack,
  playSfx,
} = useAudio();

const testSfx = () => {
  playSfx('click');
};
</script>

<style scoped>
.audio-settings {
  padding: 1rem;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.setting-group {
  margin: 1rem 0;
}

.setting-group label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-group input[type="range"] {
  width: 100%;
}

.setting-group button {
  padding: 0.5rem 1rem;
  cursor: pointer;
}

.current-track {
  margin-top: 1rem;
  font-style: italic;
  color: #666;
}
</style>
