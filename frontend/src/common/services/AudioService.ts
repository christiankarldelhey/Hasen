export type SoundEffect = 
  | 'cardPlay'
  | 'cardDraw'
  | 'bidPlace'
  | 'turnStart'
  | 'roundEnd'
  | 'victory'
  | 'defeat'
  | 'click'
  | 'hover'
  | 'notification';

export type MusicTrack = 
  | 'lobby'
  | 'gameplay'
  | 'endgame';

export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
}

class AudioService {
  private musicAudio: HTMLAudioElement | null = null;
  private currentTrack: MusicTrack | null = null;
  private soundEffects: Map<SoundEffect, HTMLAudioElement> = new Map();
  
  private settings: AudioSettings = {
    masterVolume: 1.0,
    musicVolume: 0.7,
    sfxVolume: 0.8,
    musicEnabled: true,
    sfxEnabled: true,
  };

  private musicPaths: Record<MusicTrack, string> = {
    lobby: '/audio/music/lobby.mp3',
    gameplay: '/audio/music/gameplay.mp3',
    endgame: '/audio/music/endgame.mp3',
  };

  private sfxPaths: Record<SoundEffect, string> = {
    cardPlay: '/audio/sfx/card-play.mp3',
    cardDraw: '/audio/sfx/card-draw.mp3',
    bidPlace: '/audio/sfx/bid-place.mp3',
    turnStart: '/audio/sfx/turn-start.mp3',
    roundEnd: '/audio/sfx/round-end.mp3',
    victory: '/audio/sfx/victory.mp3',
    defeat: '/audio/sfx/defeat.mp3',
    click: '/audio/sfx/click.mp3',
    hover: '/audio/sfx/hover.mp3',
    notification: '/audio/sfx/notification.mp3',
  };

  constructor() {
    this.loadSettingsFromStorage();
    this.preloadSoundEffects();
  }

  private loadSettingsFromStorage(): void {
    const stored = localStorage.getItem('audioSettings');
    if (stored) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      } catch (e) {
        console.error('Failed to load audio settings:', e);
      }
    }
  }

  private saveSettingsToStorage(): void {
    localStorage.setItem('audioSettings', JSON.stringify(this.settings));
  }

  private preloadSoundEffects(): void {
    Object.entries(this.sfxPaths).forEach(([effect, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audio.volume = this.getEffectiveVolume('sfx');
      this.soundEffects.set(effect as SoundEffect, audio);
    });
  }

  private getEffectiveVolume(type: 'music' | 'sfx'): number {
    const typeVolume = type === 'music' ? this.settings.musicVolume : this.settings.sfxVolume;
    return this.settings.masterVolume * typeVolume;
  }

  playMusic(track: MusicTrack, loop: boolean = true): void {
    if (!this.settings.musicEnabled) return;

    if (this.currentTrack === track && this.musicAudio && !this.musicAudio.paused) {
      return;
    }

    this.stopMusic();

    this.musicAudio = new Audio(this.musicPaths[track]);
    this.musicAudio.loop = loop;
    this.musicAudio.volume = this.getEffectiveVolume('music');
    this.currentTrack = track;

    this.musicAudio.play().catch(error => {
      console.warn('Audio playback blocked by browser. User interaction required:', error);
    });
  }

  stopMusic(): void {
    if (this.musicAudio) {
      this.musicAudio.pause();
      this.musicAudio.currentTime = 0;
      this.musicAudio = null;
      this.currentTrack = null;
    }
  }

  pauseMusic(): void {
    if (this.musicAudio) {
      this.musicAudio.pause();
    }
  }

  resumeMusic(): void {
    if (this.musicAudio && this.settings.musicEnabled) {
      this.musicAudio.play().catch(error => {
        console.error('Failed to resume music:', error);
      });
    }
  }

  playSoundEffect(effect: SoundEffect): void {
    if (!this.settings.sfxEnabled) return;

    const audio = this.soundEffects.get(effect);
    if (audio) {
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = this.getEffectiveVolume('sfx');
      clone.play().catch(error => {
        console.error(`Failed to play sound effect ${effect}:`, error);
      });
    }
  }

  setMasterVolume(volume: number): void {
    this.settings.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
    this.saveSettingsToStorage();
  }

  setMusicVolume(volume: number): void {
    this.settings.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
    this.saveSettingsToStorage();
  }

  setSfxVolume(volume: number): void {
    this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
    this.saveSettingsToStorage();
  }

  toggleMusic(enabled?: boolean): void {
    this.settings.musicEnabled = enabled ?? !this.settings.musicEnabled;
    
    if (!this.settings.musicEnabled) {
      this.pauseMusic();
    } else if (this.musicAudio) {
      this.resumeMusic();
    }
    
    this.saveSettingsToStorage();
  }

  toggleSfx(enabled?: boolean): void {
    this.settings.sfxEnabled = enabled ?? !this.settings.sfxEnabled;
    this.saveSettingsToStorage();
  }

  private updateVolumes(): void {
    if (this.musicAudio) {
      this.musicAudio.volume = this.getEffectiveVolume('music');
    }
    
    this.soundEffects.forEach(audio => {
      audio.volume = this.getEffectiveVolume('sfx');
    });
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  getCurrentTrack(): MusicTrack | null {
    return this.currentTrack;
  }

  isPlaying(): boolean {
    return this.musicAudio !== null && !this.musicAudio.paused;
  }
}

export const audioService = new AudioService();
