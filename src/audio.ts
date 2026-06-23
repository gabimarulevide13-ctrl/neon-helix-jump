/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicInterval: any = null;
  private isMusicPlaying = false;
  private isMuted = false;
  private currentTempo = 125; // BPM
  private musicStep = 0;

  // Sound toggles
  public musicVolume = 0.2;
  public sfxVolume = 0.5;

  constructor() {
    // Lazy loaded context
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx) {
      if (muted) {
        this.ctx.suspend();
      } else {
        this.ctx.resume();
      }
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  // General synthesizer formula
  private createOscillator(
    type: OscillatorType,
    freq: number,
    duration: number,
    gainStart: number
  ): { osc: OscillatorNode; gain: GainNode } | null {
    this.initContext();
    if (!this.ctx || this.isMuted) return null;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gainNode.gain.setValueAtTime(gainStart * this.sfxVolume, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    return { osc, gain: gainNode };
  }

  // Synthesize SFX: Bouncing sound
  public playBounce() {
    const sfx = this.createOscillator('triangle', 300, 0.15, 0.6);
    if (!sfx || !this.ctx) return;

    sfx.osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.12);
    sfx.osc.start();
    sfx.osc.stop(this.ctx.currentTime + 0.15);
  }

  // Platform break sound effect
  public playBreak() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    // We can simulate a crack/shatter with modulated noise & oscillator
    try {
      // Noise buffer for crackle
      const bufferSize = this.ctx.sampleRate * 0.12; // 120ms
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4 * this.sfxVolume, this.ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.12);

      noiseNode.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noiseNode.start();

      // Additional tonal smash component
      const sub = this.createOscillator('sawtooth', 180, 0.2, 0.5);
      if (sub) {
        sub.osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.18);
        sub.osc.start();
        sub.osc.stop(this.ctx.currentTime + 0.2);
      }
    } catch (e) {
      // Fallback
      const fallback = this.createOscillator('sawtooth', 120, 0.18, 0.6);
      if (fallback) {
        fallback.osc.start();
        fallback.osc.stop(this.ctx.currentTime + 0.18);
      }
    }
  }

  // Huge combo smash sound
  public playSmash() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;

    // Trigger powerful wave of sound elements
    const tone1 = this.createOscillator('sawtooth', 150, 0.4, 0.8);
    if (tone1) {
      tone1.osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.35);
      tone1.osc.start();
      tone1.osc.stop(this.ctx.currentTime + 0.4);
    }

    const tone2 = this.createOscillator('square', 240, 0.3, 0.5);
    if (tone2) {
      tone2.osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.28);
      tone2.osc.start();
      tone2.osc.stop(this.ctx.currentTime + 0.3);
    }
  }

  // Coin pick sound effect
  public playCoin() {
    const c1 = this.createOscillator('sine', 987.77, 0.08, 0.4); // B5
    if (!c1 || !this.ctx) return;
    c1.osc.start();
    c1.osc.stop(this.ctx.currentTime + 0.08);

    setTimeout(() => {
      const c2 = this.createOscillator('sine', 1318.51, 0.18, 0.4); // E6
      if (c2) {
        c2.osc.start();
        c2.osc.stop((this.ctx?.currentTime || 0) + 0.18);
      }
    }, 60);
  }

  // Level Up triumphant chime
  public playLevelUp() {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      setTimeout(() => {
        const chime = this.createOscillator('sine', freq, 0.25, 0.4);
        if (chime) {
          chime.osc.start();
          chime.osc.stop((this.ctx?.currentTime || 0) + 0.25);
        }
      }, index * 100);
    });
  }

  // Game over crash landing
  public playGameOver() {
    const sub = this.createOscillator('sawtooth', 120, 0.6, 0.7);
    if (!sub || !this.ctx) return;
    sub.osc.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + 0.55);
    sub.osc.start();
    sub.osc.stop(this.ctx.currentTime + 0.6);

    // Minor chord descending
    setTimeout(() => {
      const g = this.createOscillator('triangle', 220, 0.5, 0.5); // A3
      if (g) {
        g.osc.frequency.linearRampToValueAtTime(110, this.ctx.currentTime + 0.55);
        g.osc.start();
        g.osc.stop((this.ctx?.currentTime || 0) + 0.55);
      }
    }, 100);
  }

  // Click UI
  public playClick() {
    const block = this.createOscillator('sine', 800, 0.05, 0.3);
    if (block) {
      block.osc.start();
      block.osc.stop(block.osc.context.currentTime + 0.05);
    }
  }

  // Background Beat Generation (Neon-themed synth pop loop)
  public startMusic() {
    if (this.isMusicPlaying) return;
    this.initContext();
    this.isMusicPlaying = true;

    // Tempo to step size
    const stepDuration = 60 / this.currentTempo / 2; // Eighth notes
    this.musicStep = 0;

    const playStep = () => {
      if (!this.isMusicPlaying || this.isMuted || !this.ctx) return;

      const time = this.ctx.currentTime;
      const step = this.musicStep % 16;

      // Simple drum machine
      // Kick on 1, 5, 9, 13
      if (step === 0 || step === 4 || step === 8 || step === 12) {
        const kick = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(120, time);
        kick.frequency.exponentialRampToValueAtTime(45, time + 0.12);

        kickGain.gain.setValueAtTime(0.3 * this.musicVolume, time);
        kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

        kick.connect(kickGain);
        kickGain.connect(this.ctx.destination);
        kick.start(time);
        kick.stop(time + 0.15);
      }

      // Snare on 5, 13 (coinciding with 4th and 12th step)
      if (step === 4 || step === 12) {
        const snare = this.ctx.createOscillator();
        const snareGain = this.ctx.createGain();
        snare.type = 'triangle';
        snare.frequency.setValueAtTime(180, time);
        snare.frequency.exponentialRampToValueAtTime(120, time + 0.08);

        snareGain.gain.setValueAtTime(0.15 * this.musicVolume, time);
        snareGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        snare.connect(snareGain);
        snareGain.connect(this.ctx.destination);
        snare.start(time);
        snare.stop(time + 0.1);
      }

      // Arpeggiated melody line (Pentatonic scale based)
      // Notes: C3, Def3, F3, G3, Bb3, C4
      const scale = [130.81, 146.83, 174.61, 196.00, 233.08, 261.63];
      const melodyPattern = [0, 2, 4, 3, 5, 4, 3, 1, 2, 4, 5, 3, 2, 1, 4, 0];
      const harmonyPattern = [0, 0, 3, 3, 4, 4, 3, 3, 2, 2, 5, 5, 1, 1, 2, 2];

      const noteFreq = scale[melodyPattern[step] % scale.length];
      const leadNode = this.ctx.createOscillator();
      const leadGain = this.ctx.createGain();

      // Alternate synth types for a richer texture
      leadNode.type = step % 4 === 0 ? 'sine' : 'triangle';
      leadNode.frequency.setValueAtTime(noteFreq * (step % 3 === 0 ? 2 : 1), time);

      leadGain.gain.setValueAtTime(0.1 * this.musicVolume, time);
      leadGain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

      leadNode.connect(leadGain);
      leadGain.connect(this.ctx.destination);
      leadNode.start(time);
      leadNode.stop(time + 0.25);

      // Simple deep bass harmony line on certain beats
      if (step % 2 === 0) {
        const bassFreq = scale[harmonyPattern[step] % scale.length] * 0.5; // octave below
        const bassNode = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();

        bassNode.type = 'triangle';
        bassNode.frequency.setValueAtTime(bassFreq, time);

        bassGain.gain.setValueAtTime(0.12 * this.musicVolume, time);
        bassGain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

        bassNode.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassNode.start(time);
        bassNode.stop(time + 0.35);
      }

      this.musicStep++;
      this.musicInterval = setTimeout(playStep, stepDuration * 1000);
    };

    playStep();
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearTimeout(this.musicInterval);
      this.musicInterval = null;
    }
  }

  public isPlaying() {
    return this.isMusicPlaying;
  }
}

export const sfx = new SoundEngine();
