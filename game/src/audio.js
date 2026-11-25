// Sizzle & Serve: every sound is synthesized in code — no audio files.
// A tiny WebAudio helper: short blips for pickup, chop, sizzle, serve.

export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  blip(freq, dur = 0.08, type = 'sine', vol = 0.12) {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  pickup() { this.blip(660, 0.07, 'triangle'); }
  chop() { this.blip(220, 0.05, 'square', 0.08); this.blip(180, 0.05, 'square', 0.08); }
  done() { this.blip(520, 0.09, 'triangle'); this.blip(780, 0.12, 'triangle'); }
  sizzle() { this.blip(1400, 0.25, 'sawtooth', 0.03); }
  serve() { this.blip(523, 0.1, 'triangle'); setTimeout(() => this.blip(784, 0.14, 'triangle'), 90); }
  deny() { this.blip(160, 0.12, 'square', 0.08); }
  trash() { this.blip(90, 0.15, 'sawtooth', 0.08); }
  bell() { this.blip(880, 0.2, 'sine', 0.1); }
}
