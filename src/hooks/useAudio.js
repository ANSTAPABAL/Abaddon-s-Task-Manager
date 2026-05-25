import { useEffect, useRef } from 'react';

class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.masterCompressor = null;
    this.masterGain = null;
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
    
    try {
      this.masterCompressor = this.ctx.createDynamicsCompressor();
      // Configure compressor to prevent clipping smoothly
      this.masterCompressor.threshold.setValueAtTime(-16, this.ctx.currentTime);
      this.masterCompressor.knee.setValueAtTime(25, this.ctx.currentTime);
      this.masterCompressor.ratio.setValueAtTime(10, this.ctx.currentTime);
      this.masterCompressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.masterCompressor.release.setValueAtTime(0.15, this.ctx.currentTime);
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      
      this.masterCompressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn("Could not initialize master compressor/gain:", e);
    }
    
    // Start ambient background drone
    this.setupDrone();

    // Setup local double playlist if saved
    if (this.useLocalDoublePlaylist) {
      this.setupLocalDoublePlayer();
    }
  }

  getDestinationNode() {
    return this.masterCompressor || this.ctx.destination;
  }

  setMuted(muted) {
    this.isMuted = muted;
    this.updateDroneVolume();
    this.updateLocalDoubleVolume();
    if (muted) {
      this.stopHeartbeat();
      if (this.localDoublePlayer1) this.localDoublePlayer1.pause();
      if (this.localDoublePlayer2) this.localDoublePlayer2.pause();
      this.stopRain();
      this.stopRiver();
      this.stopSwamp();
      this.stopChains();
      this.stopDogs();
      this.stopLightning();
      this.stopScreams();
      this.stopWolves();
      this.stopOwls();
    } else {
      if (this.useLocalDoublePlaylist && !this.spotifyPlaying) {
        if (this.localDoublePlayer1) this.localDoublePlayer1.play().catch(e => {});
        if (this.localDoublePlayer2) this.localDoublePlayer2.play().catch(e => {});
      }
      this.restartActiveLayers();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    this.updateDroneVolume();
    this.updateLocalDoubleVolume();
    this.updateAmbientVolume();
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
    this.updateAmbientVolume();
    if (isPlaying) {
      if (this.localDoublePlayer1) this.localDoublePlayer1.pause();
      if (this.localDoublePlayer2) this.localDoublePlayer2.pause();
      this.stopRain();
      this.stopRiver();
      this.stopSwamp();
      this.stopChains();
      this.stopDogs();
      this.stopLightning();
      this.stopScreams();
      this.stopWolves();
      this.stopOwls();
    } else {
      if (this.useLocalDoublePlaylist && !this.isMuted) {
        if (this.localDoublePlayer1) this.localDoublePlayer1.play().catch(e => {});
        if (this.localDoublePlayer2) this.localDoublePlayer2.play().catch(e => {});
      }
      this.restartActiveLayers();
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
  
  setAmbientLayerActive(layerId, isActive) {
    this.init();
    if (isActive) {
      localStorage.setItem('ambient_layer_' + layerId, 'true');
      if (layerId === 'rain') this.startRain();
      else if (layerId === 'river') this.startRiver();
      else if (layerId === 'swamp') this.startSwamp();
      else if (layerId === 'chains') this.startChains();
      else if (layerId === 'dogs') this.startDogs();
      else if (layerId === 'lightning') this.startLightning();
      else if (layerId === 'screams') this.startScreams();
      else if (layerId === 'wolves') this.startWolves();
      else if (layerId === 'owls') this.startOwls();
    } else {
      localStorage.setItem('ambient_layer_' + layerId, 'false');
      if (layerId === 'rain') this.stopRain();
      else if (layerId === 'river') this.stopRiver();
      else if (layerId === 'swamp') this.stopSwamp();
      else if (layerId === 'chains') this.stopChains();
      else if (layerId === 'dogs') this.stopDogs();
      else if (layerId === 'lightning') this.stopLightning();
      else if (layerId === 'screams') this.stopScreams();
      else if (layerId === 'wolves') this.stopWolves();
      else if (layerId === 'owls') this.stopOwls();
    }
  }

  restartActiveLayers() {
    if (this.isMuted || this.spotifyPlaying) return;
    const layers = ['chains', 'dogs', 'lightning', 'rain', 'screams', 'river', 'swamp', 'wolves', 'owls'];
    layers.forEach(l => {
      if (localStorage.getItem('ambient_layer_' + l) === 'true') {
        this.setAmbientLayerActive(l, true);
      }
    });
  }

  updateAmbientVolume() {
    if (!this.ctx) return;
    const vol = (this.spotifyPlaying ? 0 : 0.12) * this.volume;
    if (this.rainGain) {
      this.rainGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.5);
    }
    if (this.riverGain) {
      this.riverGain.gain.setTargetAtTime(vol * 1.25, this.ctx.currentTime, 0.5);
    }
  }

  startRain() {
    if (!this.ctx || this.isMuted || this.spotifyPlaying) return;
    this.stopRain();
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.rainSource = this.ctx.createBufferSource();
    this.rainSource.buffer = buffer;
    this.rainSource.loop = true;
    this.rainFilter = this.ctx.createBiquadFilter();
    this.rainFilter.type = 'bandpass';
    this.rainFilter.frequency.setValueAtTime(700, this.ctx.currentTime);
    this.rainFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);
    this.rainGain = this.ctx.createGain();
    const vol = (this.spotifyPlaying ? 0 : 0.12) * this.volume;
    this.rainGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    this.rainSource.connect(this.rainFilter);
    this.rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.getDestinationNode());
    this.rainSource.start();
  }

  stopRain() {
    if (this.rainSource) {
      try { this.rainSource.stop(); } catch(e) {}
      try { this.rainSource.disconnect(); } catch(e) {}
      this.rainSource = null;
    }
    if (this.rainFilter) {
      try { this.rainFilter.disconnect(); } catch(e) {}
      this.rainFilter = null;
    }
    if (this.rainGain) {
      try { this.rainGain.disconnect(); } catch(e) {}
      this.rainGain = null;
    }
  }

  startRiver() {
    if (!this.ctx || this.isMuted || this.spotifyPlaying) return;
    this.stopRiver();
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.riverSource = this.ctx.createBufferSource();
    this.riverSource.buffer = buffer;
    this.riverSource.loop = true;
    this.riverFilter = this.ctx.createBiquadFilter();
    this.riverFilter.type = 'lowpass';
    this.riverFilter.frequency.setValueAtTime(350, this.ctx.currentTime);
    this.riverGain = this.ctx.createGain();
    const vol = (this.spotifyPlaying ? 0 : 0.15) * this.volume;
    this.riverGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    this.riverLfo = this.ctx.createOscillator();
    this.riverLfo.frequency.setValueAtTime(0.2, this.ctx.currentTime);
    this.riverLfoGain = this.ctx.createGain();
    this.riverLfoGain.gain.setValueAtTime(vol * 0.4, this.ctx.currentTime);
    this.riverLfo.connect(this.riverLfoGain);
    this.riverLfoGain.connect(this.riverGain.gain);
    this.riverSource.connect(this.riverFilter);
    this.riverFilter.connect(this.riverGain);
    this.riverGain.connect(this.getDestinationNode());
    this.riverSource.start();
    this.riverLfo.start();
  }

  stopRiver() {
    if (this.riverSource) {
      try { this.riverSource.stop(); } catch(e) {}
      try { this.riverSource.disconnect(); } catch(e) {}
      this.riverSource = null;
    }
    if (this.riverFilter) {
      try { this.riverFilter.disconnect(); } catch(e) {}
      this.riverFilter = null;
    }
    if (this.riverGain) {
      try { this.riverGain.disconnect(); } catch(e) {}
      this.riverGain = null;
    }
    if (this.riverLfo) {
      try { this.riverLfo.stop(); } catch(e) {}
      try { this.riverLfo.disconnect(); } catch(e) {}
      this.riverLfo = null;
    }
    if (this.riverLfoGain) {
      try { this.riverLfoGain.disconnect(); } catch(e) {}
      this.riverLfoGain = null;
    }
  }

  startSwamp() {
    this.stopSwamp();
    const scheduleNext = () => {
      const delay = 4000 + Math.random() * 8000;
      this.swampTimer = setTimeout(() => {
        this.playSquelch();
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  }

  stopSwamp() {
    if (this.swampTimer) {
      clearTimeout(this.swampTimer);
      this.swampTimer = null;
    }
  }

  playSquelch() {
    if (!this.ctx || this.isMuted || this.spotifyPlaying) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(150, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.1);
    filter.frequency.exponentialRampToValueAtTime(100, t + 0.3);
    filter.Q.setValueAtTime(8, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18 * this.volume, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.getDestinationNode());
    osc.start(t);
    osc.stop(t + 0.35);
  }

  startChains() {
    this.stopChains();
    const scheduleNext = () => {
      const delay = 6000 + Math.random() * 12000;
      this.chainsTimer = setTimeout(() => {
        this.playChainClank();
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  }

  stopChains() {
    if (this.chainsTimer) {
      clearTimeout(this.chainsTimer);
      this.chainsTimer = null;
    }
  }

  playChainClank() {
    if (!this.ctx || this.isMuted || this.spotifyPlaying) return;
    const t = this.ctx.currentTime;
    const frequencies = [800, 1250, 1500, 2200];
    frequencies.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq + (Math.random() * 20 - 10), t);
      const duration = 0.2 + Math.random() * 0.3;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.05 * this.volume, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.connect(gain);
      gain.connect(this.getDestinationNode());
      osc.start(t);
      osc.stop(t + duration + 0.05);
    });
  }

  startDogs() {
    this.stopDogs();
    const scheduleNext = () => {
      const delay = 10000 + Math.random() * 15000;
      this.dogsTimer = setTimeout(() => {
        this.playDogBark();
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  }

  stopDogs() {
    if (this.dogsTimer) {
      clearTimeout(this.dogsTimer);
      this.dogsTimer = null;
    }
  }

  playDogBark() {
    if (!this.ctx || this.isMuted || this.spotifyPlaying) return;
    const t = this.ctx.currentTime;
    const triggerBark = (startTime) => {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, startTime);
      osc.frequency.exponentialRampToValueAtTime(60, startTime + 0.15);
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(250, startTime);
      filter.Q.setValueAtTime(2.0, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.12 * this.volume, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.getDestinationNode());
      osc.start(startTime);
      osc.stop(startTime + 0.2);
    };
    triggerBark(t);
    triggerBark(t + 0.22);
  }

  startLightning() {
    this.stopLightning();
    const scheduleNext = () => {
      const delay = 35000 + Math.random() * 45000;
      this.lightningTimer = setTimeout(() => {
        this.playLightningStrike();
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  }

  stopLightning() {
    if (this.lightningTimer) {
      clearTimeout(this.lightningTimer);
      this.lightningTimer = null;
    }
  }

  playLightningStrike() {
    if (!this.ctx || this.isMuted || this.spotifyPlaying) return;
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 2.0;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + 1.2);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.25 * this.volume, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.getDestinationNode());
    noise.start(t);
    noise.stop(t + 2.0);
  }

  startScreams() {
    this.stopScreams();
    const scheduleNext = () => {
      const delay = 25000 + Math.random() * 45000;
      this.screamsTimer = setTimeout(() => {
        this.playDistantScream();
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  }

  stopScreams() {
    if (this.screamsTimer) {
      clearTimeout(this.screamsTimer);
      this.screamsTimer = null;
    }
  }

  playDistantScream() {
    if (!this.ctx || this.isMuted || this.spotifyPlaying) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(500, t);
    osc.frequency.linearRampToValueAtTime(750, t + 0.8);
    osc.frequency.linearRampToValueAtTime(450, t + 1.6);
    const vibrato = this.ctx.createOscillator();
    vibrato.frequency.setValueAtTime(6, t);
    const vibratoGain = this.ctx.createGain();
    vibratoGain.gain.setValueAtTime(15, t);
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(1200, t + 1.6);
    filter.Q.setValueAtTime(2.0, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.05 * this.volume, t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.getDestinationNode());
    osc.start(t);
    vibrato.start(t);
    osc.stop(t + 2.0);
    vibrato.stop(t + 2.0);
  }

  startWolves() {
    this.stopWolves();
    const scheduleNext = () => {
      const delay = 45000 + Math.random() * 45000;
      this.wolvesTimer = setTimeout(() => {
        this.playWolfHowl();
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  }

  stopWolves() {
    if (this.wolvesTimer) {
      clearTimeout(this.wolvesTimer);
      this.wolvesTimer = null;
    }
  }

  playWolfHowl() {
    if (!this.ctx || this.isMuted || this.spotifyPlaying) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.6);
    osc.frequency.setValueAtTime(450, t + 1.2);
    osc.frequency.exponentialRampToValueAtTime(150, t + 2.2);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.06 * this.volume, t + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.3);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.getDestinationNode());
    osc.start(t);
    osc.stop(t + 2.4);
  }

  startOwls() {
    this.stopOwls();
    const scheduleNext = () => {
      const delay = 20000 + Math.random() * 30000;
      this.owlsTimer = setTimeout(() => {
        this.playOwlHoot();
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  }

  stopOwls() {
    if (this.owlsTimer) {
      clearTimeout(this.owlsTimer);
      this.owlsTimer = null;
    }
  }

  playOwlHoot() {
    if (!this.ctx || this.isMuted || this.spotifyPlaying) return;
    const t = this.ctx.currentTime;
    const hoot = (time) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, time);
      osc.frequency.exponentialRampToValueAtTime(390, time + 0.08);
      osc.frequency.exponentialRampToValueAtTime(300, time + 0.22);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.08 * this.volume, time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
      osc.connect(gain);
      gain.connect(this.getDestinationNode());
      osc.start(time);
      osc.stop(time + 0.25);
    };
    hoot(t);
    hoot(t + 0.3);
  }


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
      this.droneGain.connect(this.getDestinationNode());

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

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2 * this.volume, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.getDestinationNode());

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
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.35 * this.volume, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.getDestinationNode());

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
    gain.connect(this.getDestinationNode());

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
      gain.connect(this.getDestinationNode());

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

  const setAmbientLayerActive = (layerId, isActive) => {
    synth.setAmbientLayerActive(layerId, isActive);
  };

  const restartActiveLayers = () => {
    synth.restartActiveLayers();
  };

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
    setAmbientLayerActive,
    restartActiveLayers,
    synthInstance: synth
  };
}
