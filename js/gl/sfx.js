/*
  أصوات مولّدة بالكود (WebAudio): طقطقة التحميص، الطحن، غليان الدلّة، صبّ القهوة، رنين الفنجان، خشخشة الهزّ.
  مطفأة افتراضياً؛ زر الصوت في الأعلى يشغّلها.
*/
export class Sfx {
  constructor() { this.on = false; this.ctx = null; this.master = null; this.noise = null; this.loops = {}; }
  _init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = 0.8; this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
  }
  toggle() {
    this.on = !this.on;
    if (this.on) { this._init(); if (!this.ctx) { this.on = false; return false; } if (this.ctx.state === 'suspended') this.ctx.resume(); this.chime(); }
    else this.stopAll();
    return this.on;
  }
  get t() { return this.ctx.currentTime; }
  _src(t0, dur, fType, f0, f1, q, gain, atk = 0.01) {
    if (!this.on || !this.ctx) return;
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noise; s.loop = true;
    const f = c.createBiquadFilter(); f.type = fType; f.Q.value = q; f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t0 + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + atk); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t0, Math.random()); s.stop(t0 + dur + 0.05);
  }
  _tone(t0, freq, dur, gain, type = 'sine', slide = 1) {
    if (!this.on || !this.ctx) return;
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0); o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  /* حلقة صوتية مستمرة قابلة للتعديل */
  _loop(name, fType, freq, q, gain) {
    if (!this.on || !this.ctx) return null;
    if (this.loops[name]) return this.loops[name];
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noise; s.loop = true;
    const f = c.createBiquadFilter(); f.type = fType; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.value = 0;
    s.connect(f); f.connect(g); g.connect(this.master); s.start();
    return (this.loops[name] = { s, f, g, gain });
  }
  setLoop(name, level, freq) {
    const l = this.loops[name]; if (!l) return;
    l.g.gain.setTargetAtTime(level * l.gain, this.t, 0.08);
    if (freq) l.f.frequency.setTargetAtTime(freq, this.t, 0.08);
  }
  stopAll() { for (const k in this.loops) { try { this.loops[k].s.stop(); } catch (e) {} } this.loops = {}; }

  chime() { if (!this.on) return; const t = this.t; this._tone(t, 784, 0.6, 0.07, 'triangle'); this._tone(t + 0.1, 1175, 0.8, 0.06, 'sine'); }
  /* طقطقة حبّة البنّ: ضربة قصيرة + رنين خشبي */
  crack(big = 1) {
    if (!this.on) return; const t = this.t;
    this._src(t, 0.07, 'bandpass', 3800, 2600, 1.4, 0.55 * big, 0.002);
    this._tone(t, 520, 0.05, 0.12 * big, 'triangle', 0.5);
    this._src(t + 0.02, 0.05, 'highpass', 6000, 6500, 0.6, 0.15 * big, 0.002);
  }
  tick() { if (!this.on) return; const t = this.t; this._src(t, 0.03, 'highpass', 4000 + Math.random() * 2000, 5000, 0.8, 0.08, 0.001); }
  roar(level) { if (!this.on) return; this._loop('roar', 'bandpass', 700, 0.5, 0.18); this.setLoop('roar', level, 500 + level * 500); }
  grind(level) { if (!this.on) return; this._loop('grind', 'bandpass', 1500, 1.2, 0.22); this.setLoop('grind', level, 1200 + Math.sin(this.t * 22) * 500); }
  bubble(level) {
    if (!this.on) return; this._loop('boil', 'lowpass', 340, 0.3, 0.12); this.setLoop('boil', level);
    if (level > 0.2 && Math.random() < level * 0.28) this._tone(this.t, 180 + Math.random() * 260, 0.09, 0.05 * level, 'sine', 1.8);
  }
  pour(level, fill = 0) { if (!this.on) return; this._loop('pour', 'bandpass', 1800, 1.1, 0.3); this.setLoop('pour', level, 1500 + fill * 2400); }
  clink(k = 1) { if (!this.on) return; const t = this.t, f = 1900 * k; this._tone(t, f, 0.9, 0.12); this._tone(t, f * 2.76, 0.5, 0.05); this._tone(t, f * 5.4, 0.25, 0.025); }
  sip() { if (!this.on) return; const t = this.t; this._src(t, 0.35, 'bandpass', 600, 300, 1.2, 0.18, 0.05); this._tone(t + 0.12, 120, 0.15, 0.1, 'sine', 0.7); }
  rattle() { if (!this.on) return; const t = this.t; for (let i = 0; i < 7; i++) this._tone(t + i * 0.035, 2400 + Math.random() * 900, 0.07, 0.07, 'triangle', 0.7); }
  done() { if (!this.on) return; const t = this.t; this._tone(t, 523, 1.2, 0.08, 'triangle'); this._tone(t + 0.14, 659, 1.3, 0.07, 'triangle'); this._tone(t + 0.28, 784, 1.6, 0.07, 'sine'); this._tone(t + 0.42, 1047, 2, 0.06, 'sine'); }
}
