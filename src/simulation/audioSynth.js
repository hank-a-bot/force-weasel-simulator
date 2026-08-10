// Web Audio API Retro 8-Bit Chiptune Sound Synthesizer for Force Weasel Simulator
class RetroSoundEngine {
  constructor() {
    this.ctx = null;
    this.audioDest = null;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.audioDest = this.ctx.createMediaStreamDestination();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  getAudioStreamTrack() {
    if (this.audioDest && this.audioDest.stream.getAudioTracks().length > 0) {
      return this.audioDest.stream.getAudioTracks()[0];
    }
    return null;
  }

  connect(node) {
    if (!node || this.isMuted) return;
    node.connect(this.ctx.destination);
    if (this.audioDest) {
      node.connect(this.audioDest);
    }
  }

  // 8-Bit Retro Starter Gun (NES Noise + Square wave drop)
  playStarterGun() {
    this.init();
    if (this.isMuted) return;
    const now = this.ctx.currentTime;

    // Noise component
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Square wave pitch drop
    const osc = this.ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    noise.connect(gain);
    osc.connect(gain);
    this.connect(gain);

    noise.start(now);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // 8-Bit Retro Whistle
  playWhistle() {
    this.init();
    if (this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(1800, now);
    // Rapid retro trill modulation
    for (let i = 0; i < 6; i++) {
      osc.frequency.setValueAtTime(1800, now + i * 0.05);
      osc.frequency.setValueAtTime(2100, now + i * 0.05 + 0.025);
    }

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    this.connect(gain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // 8-Bit Crowd Cheer Burst
  playCrowdRoar(intensity = 0.5) {
    this.init();
    if (this.isMuted) return;
    const now = this.ctx.currentTime;
    const duration = 1.2;

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const progress = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.sin(progress * Math.PI);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(600, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3 * intensity, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    this.connect(gain);

    noise.start(now);
  }

  // 8-Bit Step Blip
  playStep() {
    this.init();
    if (this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.04);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

    osc.connect(gain);
    this.connect(gain);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // 8-Bit Chiptune Victory Fanfare
  playVictoryFanfare() {
    this.init();
    if (this.isMuted) return;
    const now = this.ctx.currentTime;

    // Iconic NES 8-bit victory arpeggio: C4, E4, G4, C5, E5, G5, C6!
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "square"; // Classic 8-bit NES square wave
      osc.frequency.setValueAtTime(freq, startTime);

      const dur = idx === notes.length - 1 ? 0.7 : 0.08;
      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + dur);

      osc.connect(gain);
      this.connect(gain);

      osc.start(startTime);
      osc.stop(startTime + dur);
    });
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}

export const soundEngine = new RetroSoundEngine();
