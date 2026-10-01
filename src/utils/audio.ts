// Web Audio API Synthesizer for elementary school sound & echo exploration
import { SoundType, MaterialType } from '../types';
import { getInitialDb } from './decibels';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Play direct sound scaled to its authentic decibel strength
  public playSound(type: SoundType, loudness: number = 5) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Calculate actual decibel level for this specific sound type
    const db = getInitialDb(type, loudness);
    // Decibel-scaled audio gain (e.g. Bat/Whistle are gentler, Drums/Yodels are much punchier!)
    const dbGainMultiplier = Math.max(0.18, Math.min(1.0, (db - 35) / 70));
    const masterGain = dbGainMultiplier * 0.6;

    switch (type) {
      case 'clap':
        this.playClap(ctx, masterGain);
        break;
      case 'whistle':
        this.playWhistle(ctx, masterGain);
        break;
      case 'drum':
        this.playDrum(ctx, masterGain);
        break;
      case 'yodel':
        this.playYodel(ctx, masterGain);
        break;
      case 'bat':
        this.playBatChirp(ctx, masterGain);
        break;
      case 'yell':
      default:
        this.playYell(ctx, masterGain);
        break;
    }
  }

  // Play reflected echo sound with acoustic modifications
  public playEcho(type: SoundType, loudness: number, material: MaterialType, distanceMeters: number) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const initialDb = getInitialDb(type, loudness);
    const dbGainMultiplier = Math.max(0.18, Math.min(1.0, (initialDb - 35) / 70));

    // Distance attenuation: sound spreads out in spherical waves
    // Kid-friendly scaling so even at 250m it's audible but noticeably quieter
    const distanceFactor = Math.max(0.18, 1 - (distanceMeters / 300) * 0.68);

    // Material reflectivity and filtering
    let materialGain = 1.0;
    let cutoffFrequency = 8000;

    if (material === 'rock') {
      materialGain = 0.95;
      cutoffFrequency = 7500; // Crisp high reflections
    } else if (material === 'brick') {
      materialGain = 0.85;
      cutoffFrequency = 6000;
    } else if (material === 'trees') {
      materialGain = 0.35;
      cutoffFrequency = 1800; // Leaves scatter and absorb highs
    } else if (material === 'curtain') {
      materialGain = 0.08; // Soft materials absorb almost all sound
      cutoffFrequency = 600; // Very muffled
    }

    const echoGain = dbGainMultiplier * 0.55 * distanceFactor * materialGain;
    if (echoGain < 0.008) return; // Absorbed completely!

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoffFrequency, ctx.currentTime);
    filter.connect(ctx.destination);

    // Play with pitch slightly softened and filtered
    switch (type) {
      case 'clap':
        this.playClap(ctx, echoGain, filter);
        break;
      case 'whistle':
        this.playWhistle(ctx, echoGain, filter);
        break;
      case 'drum':
        this.playDrum(ctx, echoGain, filter);
        break;
      case 'yodel':
        this.playYodel(ctx, echoGain, filter);
        break;
      case 'bat':
        this.playBatChirp(ctx, echoGain, filter);
        break;
      case 'yell':
      default:
        this.playYell(ctx, echoGain, filter);
        break;
    }
  }

  // Synthesis helpers
  private playYell(ctx: AudioContext, gainAmount: number, destNode?: AudioNode) {
    const dest = destNode || ctx.destination;
    const t = ctx.currentTime;

    // Human vocal simulation using dual formant oscillators
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    // Vowel "Aaaaah" / "Hellooo" pitch contour (350Hz rising to 420Hz then falling to 320Hz)
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(320, t);
    osc1.frequency.linearRampToValueAtTime(420, t + 0.15);
    osc1.frequency.exponentialRampToValueAtTime(300, t + 0.5);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(640, t);
    osc2.frequency.linearRampToValueAtTime(840, t + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(600, t + 0.5);

    // Vowel formant filter
    const formant = ctx.createBiquadFilter();
    formant.type = 'bandpass';
    formant.frequency.setValueAtTime(750, t);
    formant.Q.setValueAtTime(4, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(gainAmount, t + 0.05);
    gain.gain.setValueAtTime(gainAmount, t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    osc1.connect(formant);
    osc2.connect(formant);
    formant.connect(gain);
    gain.connect(dest);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.55);
    osc2.stop(t + 0.55);
  }

  private playClap(ctx: AudioContext, gainAmount: number, destNode?: AudioNode) {
    const dest = destNode || ctx.destination;
    const t = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.03));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, t);
    filter.Q.setValueAtTime(3, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainAmount * 1.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(t);
  }

  private playWhistle(ctx: AudioContext, gainAmount: number, destNode?: AudioNode) {
    const dest = destNode || ctx.destination;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Cheerful upward whistle: 900Hz -> 1300Hz -> 1200Hz
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(1300, t + 0.18);
    osc.frequency.linearRampToValueAtTime(1200, t + 0.4);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(gainAmount * 0.8, t + 0.04);
    gain.gain.setValueAtTime(gainAmount * 0.8, t + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.45);
  }

  private playDrum(ctx: AudioContext, gainAmount: number, destNode?: AudioNode) {
    const dest = destNode || ctx.destination;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.25);

    gain.gain.setValueAtTime(gainAmount * 1.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  private playYodel(ctx: AudioContext, gainAmount: number, destNode?: AudioNode) {
    const dest = destNode || ctx.destination;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    // Mountain Yodel: Chest voice 300Hz -> Falsetto flip 600Hz -> 350Hz -> 700Hz
    osc.frequency.setValueAtTime(330, t);
    osc.frequency.setValueAtTime(660, t + 0.12);
    osc.frequency.setValueAtTime(392, t + 0.24);
    osc.frequency.setValueAtTime(784, t + 0.36);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(gainAmount * 0.8, t + 0.03);
    gain.gain.setValueAtTime(gainAmount * 0.8, t + 0.42);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.5);
  }

  private playBatChirp(ctx: AudioContext, gainAmount: number, destNode?: AudioNode) {
    const dest = destNode || ctx.destination;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Audible simulation of ultrasonic echolocation chirp
    osc.frequency.setValueAtTime(2400, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.1);

    gain.gain.setValueAtTime(gainAmount * 0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  // Fun celebratory star chime when completing a challenge
  public playSuccessChime() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.001, t + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, t + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.35);
    });
  }
}

export const soundEngine = new SoundEngine();
