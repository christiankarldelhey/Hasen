import { ref, computed, onUnmounted } from 'vue';
import { audioService, type SoundEffect, type MusicTrack, type AudioSettings } from '../services/AudioService';

export function useAudio() {
  const settings = ref<AudioSettings>(audioService.getSettings());
  const currentTrack = ref<MusicTrack | null>(audioService.getCurrentTrack());
  const isPlaying = ref<boolean>(audioService.isPlaying());

  let updateInterval: number | null = null;

  const startTracking = () => {
    updateInterval = window.setInterval(() => {
      currentTrack.value = audioService.getCurrentTrack();
      isPlaying.value = audioService.isPlaying();
    }, 500);
  };

  const stopTracking = () => {
    if (updateInterval !== null) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
  };

  startTracking();

  onUnmounted(() => {
    stopTracking();
  });

  const playMusic = (track: MusicTrack, loop: boolean = true) => {
    audioService.playMusic(track, loop);
    currentTrack.value = audioService.getCurrentTrack();
    isPlaying.value = audioService.isPlaying();
  };

  const stopMusic = () => {
    audioService.stopMusic();
    currentTrack.value = null;
    isPlaying.value = false;
  };

  const pauseMusic = () => {
    audioService.pauseMusic();
    isPlaying.value = false;
  };

  const resumeMusic = () => {
    audioService.resumeMusic();
    isPlaying.value = audioService.isPlaying();
  };

  const playSfx = (effect: SoundEffect) => {
    audioService.playSoundEffect(effect);
  };

  const setMasterVolume = (volume: number) => {
    audioService.setMasterVolume(volume);
    settings.value = audioService.getSettings();
  };

  const setMusicVolume = (volume: number) => {
    audioService.setMusicVolume(volume);
    settings.value = audioService.getSettings();
  };

  const setSfxVolume = (volume: number) => {
    audioService.setSfxVolume(volume);
    settings.value = audioService.getSettings();
  };

  const toggleMusic = (enabled?: boolean) => {
    audioService.toggleMusic(enabled);
    settings.value = audioService.getSettings();
    isPlaying.value = audioService.isPlaying();
  };

  const toggleSfx = (enabled?: boolean) => {
    audioService.toggleSfx(enabled);
    settings.value = audioService.getSettings();
  };

  const masterVolume = computed({
    get: () => settings.value.masterVolume,
    set: (value: number) => setMasterVolume(value)
  });

  const musicVolume = computed({
    get: () => settings.value.musicVolume,
    set: (value: number) => setMusicVolume(value)
  });

  const sfxVolume = computed({
    get: () => settings.value.sfxVolume,
    set: (value: number) => setSfxVolume(value)
  });

  const musicEnabled = computed({
    get: () => settings.value.musicEnabled,
    set: (value: boolean) => toggleMusic(value)
  });

  const sfxEnabled = computed({
    get: () => settings.value.sfxEnabled,
    set: (value: boolean) => toggleSfx(value)
  });

  return {
    settings,
    currentTrack,
    isPlaying,
    masterVolume,
    musicVolume,
    sfxVolume,
    musicEnabled,
    sfxEnabled,
    playMusic,
    stopMusic,
    pauseMusic,
    resumeMusic,
    playSfx,
    setMasterVolume,
    setMusicVolume,
    setSfxVolume,
    toggleMusic,
    toggleSfx,
  };
}
