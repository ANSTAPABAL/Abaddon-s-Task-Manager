import { useEffect, useRef } from 'react';

class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.droneGain = null;
    this.heartbeatTimer = null;
    this.currentBpm = 60;
    this.isMuted = localStorage.getItem('default_muted') === 'true';
    this.volume = localStorage.getItem('default_volume') !== null ? Number(localStorage.getItem('default_volume')) : 0.5;
    this.currentMood = localStorage.getItem('default_ambience') || 'quiet_focus'; // escape, hunt, siege, deconstruct, recovery, quiet_focus
    this.spotifyPlaying = false;
    this.localDoublePlayer1 = null;
    this.localDoublePlayer2 = null;
    this.useLocalDoublePlaylist = localStorage.getItem('use_local_double_playlist') === 'true';
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();
    
    // Start ambient background drone
    this.setupDrone();

    // Setup local double playlist if saved
    if (this.useLocalDoublePlaylist) {
      this.setupLocalDoublePlayer();
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    this.updateDroneVolume();
    this.updateLocalDoubleVolume();
    if (muted) {
      this.stopHeartbeat();
      if (this.localDoublePlayer1) this.localDoublePlayer1.pause();
      if (this.localDoublePlayer2) this.localDoublePlayer2.pause();
    } else {
      if (this.useLocalDoublePlaylist && !this.spotifyPlaying) {
        if (this.localDoublePlayer1) this.localDoublePlayer1.play().catch(e => {});
        if (this.localDoublePlayer2) this.localDoublePlayer2.play().catch(e => {});
      }
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    this.updateDroneVolume();
    this.updateLocalDoubleVolume();
  }

  updateDroneVolume() {
    if (!this.droneGain || !this.ctx) return;
    const t = this.ctx.currentTime;
    const targetVol = (this.isMuted || this.spotifyPlaying || this.useLocalDoublePlaylist) ? 0 : this.getDroneVolumeForMood(this.currentMood) * this.volume;
    this.droneGain.gain.setTargetAtTime(targetVol, t, 1.0);
  }

  setSpotifyPlaying(isPlaying) {
    this.spotifyPlaying = isPlaying;
    this.updateDroneVolume();
    this.updateLocalDoubleVolume();
    if (isPlaying) {
      if (this.localDoublePlayer1) this.localDoublePlayer1.pause();
      if (this.localDoublePlayer2) this.localDoublePlayer2.pause();
    } else {
      if (this.useLocalDoublePlaylist && !this.isMuted) {
        if (this.localDoublePlayer1) this.localDoublePlayer1.play().catch(e => {});
        if (this.localDoublePlayer2) this.localDoublePlayer2.play().catch(e => {});
      }
    }
  }

  setupLocalDoublePlayer() {
    this.stopLocalDoublePlayer();
    
    const track1Url = 'http://localhost:3001/tracks/fear_and_hunger.mp3';
    const track2Url = 'http://localhost:3001/tracks/brown_noise.mp3';
    
    this.localDoublePlayer1 = new Audio(track1Url);
    this.localDoublePlayer1.loop = true;
    this.localDoublePlayer1.volume = this.volume;
    
    this.localDoublePlayer2 = new Audio(track2Url);
    this.localDoublePlayer2.loop = true;
    this.localDoublePlayer2.volume = this.volume * 0.8;

    const setRandomTime = (player) => {
      if (player.duration) {
        player.currentTime = Math.random() * player.duration;
      } else {
        player.addEventListener('loadedmetadata', () => {
          if (player.duration) {
            player.currentTime = Math.random() * player.duration;
          }
        }, { once: true });
      }
    };

    setRandomTime(this.localDoublePlayer1);
    setRandomTime(this.localDoublePlayer2);
    
    if (!this.isMuted && !this.spotifyPlaying && this.useLocalDoublePlaylist) {
      this.localDoublePlayer1.play().catch(e => console.warn("Could not play F&H track:", e));
      this.localDoublePlayer2.play().catch(e => console.warn("Could not play Brown Noise track:", e));
    }
  }
  
  stopLocalDoublePlayer() {
    if (this.localDoublePlayer1) {
      this.localDoublePlayer1.pause();
      this.localDoublePlayer1 = null;
    }
    if (this.localDoublePlayer2) {
      this.localDoublePlayer2.pause();
      this.localDoublePlayer2 = null;
    }
  }
  
  updateLocalDoubleVolume() {
    if (this.localDoublePlayer1) {
      this.localDoublePlayer1.volume = (this.isMuted || this.spotifyPlaying || !this.useLocalDoublePlaylist) ? 0 : this.volume;
    }
    if (this.localDoublePlayer2) {
      this.localDoublePlayer2.volume = (this.isMuted || this.spotifyPlaying || !this.useLocalDoublePlaylist) ? 0 : this.volume * 0.8;
    }
  }
  
  setUseLocalDoublePlaylist(useDouble) {
    this.useLocalDoublePlaylist = useDouble;
    localStorage.setItem('use_local_double_playlist', useDouble ? 'true' : 'false');
    if (useDouble) {
      if (this.droneGain && this.ctx) {
        this.droneGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
      }
      this.setupLocalDoublePlayer();
    } else {
      this.stopLocalDoublePlayer();
      this.updateDroneVolume();
    }
  }

  // --- AUTOMATIC DUAL FILE-OR-SYNTH CONNECTOR ---
  playFileOrSynth(fileUrl, synthMethod) {
    if (this.isMuted) return;
    this.init();
    
    const audio = new Audio(fileUrl);
    audio.volume = this.volume;
    
    audio.play()
      .catch(() => {
        // Fallback to browser real-time procedural synthesis if file is not found (404)
        synthMethod();
      });
  }

  // --- 1. AMBIENT DRONE SYNTH ---
  setupDrone() {
    if (!this.ctx || this.isMuted) return;

    try {
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.droneGain.connect(this.ctx.destination);

      // Low pass filter to make it dark and muffled
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, this.ctx.currentTime);
      filter.Q.setValueAtTime(5, this.ctx.currentTime);
      filter.connect(this.droneGain);

      // Osc 1 - Deep drone
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = 'sawtooth';
      this.droneOsc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note
      this.droneOsc1.connect(filter);

      // Osc 2 - Detuned sub-drone
      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = 'sine';
      this.droneOsc2.frequency.setValueAtTime(55.5, this.ctx.currentTime); // Detuned for beating effect
      this.droneOsc2.connect(filter);

      this.droneOsc1.start();
      this.droneOsc2.start();

      // Fade in drone
      this.setMood(this.currentMood);
    } catch (e) {
      console.warn("Could not start ambient drone synth:", e);
    }
  }

  getDroneVolumeForMood(mood) {
    switch (mood) {
      case 'escape': return 0.15;
      case 'hunt': return 0.08;
      case 'siege': return 0.25;
      case 'deconstruct': return 0.10;
      case 'recovery': return 0.04;
      case 'quiet_focus': return 0.02;
      default: return 0.05;
    }
  }

  setMood(mood) {
    this.currentMood = mood;
    if (!this.ctx) return;
    this.init();

    if (this.isMuted || !this.droneGain || !this.droneOsc1 || !this.droneOsc2) return;

    const t = this.ctx.currentTime;
    this.updateDroneVolume();

    if (mood === 'siege') {
      this.droneOsc1.frequency.setTargetAtTime(48.99, t, 2.0); // G1
      this.droneOsc2.frequency.setTargetAtTime(49.49, t, 2.0);
    } else if (mood === 'escape') {
      this.droneOsc1.frequency.setTargetAtTime(41.20, t, 2.0); // E1
      this.droneOsc2.frequency.setTargetAtTime(41.80, t, 2.0);
    } else if (mood === 'recovery') {
      this.droneOsc1.frequency.setTargetAtTime(65.41, t, 2.0); // C2
      this.droneOsc2.frequency.setTargetAtTime(65.81, t, 2.0);
    } else {
      this.droneOsc1.frequency.setTargetAtTime(55.00, t, 2.0); // A1
      this.droneOsc2.frequency.setTargetAtTime(55.50, t, 2.0);
    }
  }

  // --- 2. CLICK SOUND ---
  playClick() {
    this.playFileOrSynth('/sounds/click.mp3', () => this.playClickSynth());
  }

  playClickSynth() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);

    gain.gain.setValueAtTime(0.2 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  // --- 3. BONE CRACK ---
  playBoneCrack() {
    this.playFileOrSynth('/sounds/bonecrack.mp3', () => this.playBoneCrackSynth());
  }

  playBoneCrackSynth() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      let noise = Math.random() * 2 - 1;
      if (i % 80 === 0) {
        noise += (Math.random() * 2 - 1) * 3;
      }
      data[i] = noise;
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.Q.setValueAtTime(2, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noiseNode.start(t);
    noiseNode.stop(t + 0.15);
  }

  // --- 4. HEARTBEAT ---
  playHeartbeatSound() {
    this.playFileOrSynth('/sounds/heartbeat.mp3', () => this.playHeartbeatSynth());
  }

  playHeartbeatSynth() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.triggerBeat(t, 0.45);
    this.triggerBeat(t + 0.15, 0.28);
  }

  triggerBeat(time, multiplier) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, time);
    osc.frequency.exponentialRampToValueAtTime(25, time + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(60, time);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.8 * multiplier * this.volume, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  startHeartbeat(bpm = 60) {
    this.init();
    this.stopHeartbeat();
    this.currentBpm = bpm;

    const intervalMs = (60 / bpm) * 1000;
    
    const beat = () => {
      this.playHeartbeatSound();
      this.heartbeatTimer = setTimeout(beat, intervalMs);
    };

    beat();
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // --- 5. SUCCESS RITUAL CHIME ---
  playSuccessChime() {
    this.playFileOrSynth('/sounds/success.mp3', () => this.playSuccessChimeSynth());
  }

  playSuccessChimeSynth() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.50];

    chords.forEach((freq, idx) => {
      const triggerTime = t + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, triggerTime);

      gain.gain.setValueAtTime(0, triggerTime);
      gain.gain.linearRampToValueAtTime(0.12 * this.volume, triggerTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, triggerTime + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(triggerTime);
      osc.stop(triggerTime + 0.9);
    });
  }
}

// Create a single global synthesizer instance
const synth = new AudioSynthesizer();

export function useAudio() {
  const initAudio = () => {
    synth.init();
  };

  const playClick = () => synth.playClick();
  const playBoneCrack = () => synth.playBoneCrack();
  const playSuccess = () => synth.playSuccessChime();
  const setMuted = (muted) => synth.setMuted(muted);
  const setVolume = (vol) => synth.setVolume(vol);
  const setAtmosphereMood = (mood) => synth.setMood(mood);
  const startHeartbeat = (bpm) => synth.startHeartbeat(bpm);
  const stopHeartbeat = () => synth.stopHeartbeat();
  const setSpotifyPlaying = (isPlaying) => synth.setSpotifyPlaying(isPlaying);
  const setUseLocalDoublePlaylist = (useDouble) => synth.setUseLocalDoublePlaylist(useDouble);

  return {
    initAudio,
    playClick,
    playBoneCrack,
    playSuccess,
    setMuted,
    setVolume,
    setAtmosphereMood,
    startHeartbeat,
    stopHeartbeat,
    setSpotifyPlaying,
    setUseLocalDoublePlaylist,
    synthInstance: synth
  };
}
