/*
  لعبة "اقلب الفنجان": فنجان بمنظر علوي على canvas ثنائي الأبعاد.
  المراحل: idle (وجه القهوة بزبده يدور) ← drain (تُشرب القهوة ويبقى الثُّفل) ← flip (يُقلب الفنجان) ← grow (يسيل الثُّفل ويرسم أشكاله) ← reveal (رموز تُقرأ).
  النتيجة حتمية: نفس الاسم في نفس اليوم يعطي نفس الفنجان. للتسلية فقط.
*/
const TAU = Math.PI * 2;
const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export const SYMBOLS = ['bird', 'key', 'heart', 'ring', 'eye', 'star', 'fish', 'road', 'mountain', 'tree', 'moon', 'ship'];

/* رسم الرموز داخل مربع نصف قطره 1 (stroke/fill بنيّ داكن) */
const DRAW = {
  bird(g) { g.beginPath(); g.moveTo(-1, .1); g.quadraticCurveTo(-.55, -.85, 0, -.05); g.quadraticCurveTo(.55, -.85, 1, .1); g.stroke(); g.beginPath(); g.arc(0, .12, .13, 0, TAU); g.fill(); },
  key(g) { g.beginPath(); g.arc(-.6, 0, .36, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(-.24, 0); g.lineTo(1, 0); g.moveTo(.62, 0); g.lineTo(.62, .38); g.moveTo(.9, 0); g.lineTo(.9, .3); g.stroke(); },
  heart(g) { g.beginPath(); g.moveTo(0, .85); g.bezierCurveTo(-1.2, -.05, -.7, -.95, 0, -.4); g.bezierCurveTo(.7, -.95, 1.2, -.05, 0, .85); g.fill(); },
  ring(g) { g.beginPath(); g.arc(0, .18, .62, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(0, -.75); g.lineTo(.26, -.45); g.lineTo(0, -.2); g.lineTo(-.26, -.45); g.closePath(); g.fill(); },
  eye(g) { g.beginPath(); g.moveTo(-1, 0); g.quadraticCurveTo(0, -.95, 1, 0); g.quadraticCurveTo(0, .95, -1, 0); g.stroke(); g.beginPath(); g.arc(0, 0, .26, 0, TAU); g.fill(); },
  star(g) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .42 : 1; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); },
  fish(g) { g.beginPath(); g.ellipse(-.1, 0, .72, .4, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(.55, 0); g.lineTo(1, -.45); g.lineTo(1, .45); g.closePath(); g.fill(); },
  road(g) { g.beginPath(); g.moveTo(-.7, 1); g.lineTo(-.06, -1); g.moveTo(.7, 1); g.lineTo(.06, -1); g.stroke(); g.save(); g.lineWidth *= .8; g.setLineDash([.22, .3]); g.beginPath(); g.moveTo(0, 1); g.lineTo(0, -.9); g.stroke(); g.restore(); },
  mountain(g) { g.beginPath(); g.moveTo(-1, .8); g.lineTo(-.25, -.7); g.lineTo(.15, -.05); g.lineTo(.5, -.45); g.lineTo(1, .8); g.closePath(); g.fill(); },
  tree(g) { g.beginPath(); g.moveTo(0, -1); g.lineTo(.62, -.1); g.lineTo(.3, -.1); g.lineTo(.8, .55); g.lineTo(-.8, .55); g.lineTo(-.3, -.1); g.lineTo(-.62, -.1); g.closePath(); g.fill(); g.fillRect(-.12, .55, .24, .42); },
  moon(g) { g.beginPath(); g.arc(0, 0, .9, -Math.PI * .72, Math.PI * .72); g.arc(.42, 0, .74, Math.PI * .6, -Math.PI * .6, true); g.closePath(); g.fill(); },
  ship(g) { g.beginPath(); g.moveTo(-.95, .25); g.lineTo(.95, .25); g.lineTo(.62, .72); g.lineTo(-.62, .72); g.closePath(); g.fill(); g.beginPath(); g.moveTo(0, .2); g.lineTo(0, -.95); g.stroke(); g.beginPath(); g.moveTo(.08, -.9); g.lineTo(.82, .1); g.lineTo(.08, .1); g.closePath(); g.fill(); g.beginPath(); g.moveTo(-.08, -.6); g.lineTo(-.6, .1); g.lineTo(-.08, .1); g.closePath(); g.fill(); }
};

export class Fortune {
  constructor(canvas, opts = {}) {
    this.cv = canvas; this.g = canvas.getContext('2d'); this.opts = opts;
    this.state = 'idle'; this.t0 = performance.now(); this.time = 0; this.symbols = []; this.drips = []; this.blobs = []; this.running = false;
    this.size(); this._seedIdle(); addEventListener('resize', () => this.size());
  }
  size() {
    const r = this.cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2), w = Math.max(240, Math.round((r.width || 480) * d));
    this.cv.width = w; this.cv.height = w; this.W = w;
  }
  _seedIdle() {
    const R = rng(7); this.blobs = [];
    for (let i = 0; i < 26; i++) this.blobs.push({ a: R() * TAU, r: .04 + R() * .25, s: .018 + R() * .05, sp: (R() - .5) * .5, o: .25 + R() * .45 });
    this.bubs = []; for (let i = 0; i < 46; i++) this.bubs.push({ a: R() * TAU, r: .07 + R() * .24, s: .004 + R() * .011, sp: (R() - .5) * .22 });
  }
  start() { if (this.running) return; this.running = true; const loop = () => { if (!this.running) return; requestAnimationFrame(loop); this.frame(); }; requestAnimationFrame(loop); }
  stop() { this.running = false; }
  to(state) { this.state = state; this.t0 = performance.now(); }

  /* يبدأ التسلسل الكامل لاسم معيّن */
  run(name) {
    const day = new Date(); const key = (name || '').trim().toLowerCase() + '|' + day.getFullYear() + '-' + (day.getMonth() + 1) + '-' + day.getDate();
    const R = rng(hash(key)); this.R = R;
    // الأشكال الثلاثة
    const pool = SYMBOLS.slice(); this.symbols = [];
    const baseA = R() * TAU;
    for (let i = 0; i < 3; i++) { const k = pool.splice(Math.floor(R() * pool.length), 1)[0]; this.symbols.push({ key: k, a: baseA + i * (TAU / 3) + (R() - .5) * .6, r: .15 + R() * .1, s: .052 + R() * .02, rot: (R() - .5) * 1.2 }); }
    // السيلان
    this.drips = []; const N = 96, ph1 = R() * TAU, ph2 = R() * TAU, ph3 = R() * TAU;
    const dens = (a) => clamp(.5 + .32 * Math.sin(a * 2 + ph1) + .22 * Math.sin(a * 3 + ph2) + .16 * Math.sin(a * 5 + ph3), .08, 1);
    for (let i = 0; i < N; i++) {
      const a = (i / N) * TAU + (R() - .5) * (TAU / N) * 1.6, dn = dens(a);
      if (R() > dn * 1.1) continue;
      const len = (.07 + R() * .2) * (.55 + .85 * dn), segs = 16, pts = []; let ang = a, rr = .035 + R() * .04; const bend = (R() - .5) * .05;
      for (let k = 0; k <= segs; k++) { pts.push([ang, rr]); ang += (R() - .5) * .07 + bend; rr += len / segs; }
      this.drips.push({ pts, w: 1 + R() * 4.6 * (.6 + dn * .8), al: .25 + R() * .55, branch: R() < .45 ? { at: 3 + Math.floor(R() * 8), da: (R() - .5) * .7, l: .04 + R() * .09 } : null });
    }
    this.grains = []; for (let i = 0; i < 520; i++) this.grains.push({ a: R() * TAU, r: .03 + R() * .29, s: .0016 + R() * .0042, al: .2 + R() * .55 });
    this.pile = []; for (let i = 0; i < 14; i++) this.pile.push({ a: (i / 14) * TAU, r: .035 + R() * .03 });
    this.rings = [.19 + R() * .03, .25 + R() * .03, .3 + R() * .01];
    this.to('drain');
  }
  reset() { this.symbols = []; this.to('idle'); this.opts.onReset && this.opts.onReset(); }

  frame() {
    const now = performance.now(), el = (now - this.t0) / 1000; this.time = now / 1000;
    const g = this.g, W = this.W; g.clearRect(0, 0, W, W);
    g.save(); g.translate(W / 2, W / 2);
    if (this.state === 'flip') {
      const u = clamp(el / .9), s = Math.cos(u * Math.PI);          // 1 → -1
      g.scale(Math.abs(s) < .02 ? .02 : s, 1 + Math.sin(u * Math.PI) * .06);
      this._cup(u < .5 ? 'residue' : 'interior', 0);
      if (u >= 1) this.to('grow');
    } else if (this.state === 'grow') {
      const u = clamp(el / 2.8); this._cup('interior', u);
      if (u >= 1) { this.to('reveal'); this.opts.onReveal && this.opts.onReveal(this.symbols.map(s => s.key)); }
    } else if (this.state === 'reveal') {
      this._cup('interior', 1); this._symbols(clamp(el / 2.4));
    } else if (this.state === 'drain') {
      const u = clamp(el / 2.2); this._cup('liquid', u);
      if (u >= 1) this.to('flip');
    } else this._cup('liquid', 0);
    g.restore();
  }

  _cup(mode, u) {
    const g = this.g, W = this.W, R0 = W * .485;
    // صحن نحاسي
    let gr = g.createRadialGradient(0, 0, R0 * .55, 0, 0, R0);
    gr.addColorStop(0, '#4b3a22'); gr.addColorStop(.8, '#8a6a36'); gr.addColorStop(.93, '#c99a46'); gr.addColorStop(1, '#6a5028');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,230,170,.35)'; g.lineWidth = W * .004; g.beginPath(); g.arc(0, 0, R0 * .985, 0, TAU); g.stroke();
    // الفنجان: حلقة خارجية بيضاء وحافة ذهبية
    const Rc = W * .37;
    g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.arc(W * .012, W * .02, Rc * 1.02, 0, TAU); g.fill();
    gr = g.createRadialGradient(-Rc * .3, -Rc * .35, Rc * .2, 0, 0, Rc);
    gr.addColorStop(0, '#fffaf0'); gr.addColorStop(1, '#e6dccb'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, Rc, 0, TAU); g.fill();
    g.strokeStyle = '#c99a46'; g.lineWidth = W * .007; g.beginPath(); g.arc(0, 0, Rc * .985, 0, TAU); g.stroke();
    g.lineWidth = W * .0025; g.beginPath(); g.arc(0, 0, Rc * .93, 0, TAU); g.stroke();
    // الجدار الداخلي
    const Ri = Rc * .87;
    gr = g.createRadialGradient(0, 0, Ri * .15, 0, 0, Ri);
    gr.addColorStop(0, '#e9e0cc'); gr.addColorStop(.7, '#f6efe0'); gr.addColorStop(1, '#fffaf0');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, Ri, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(120,95,55,.25)'; g.lineWidth = W * .004; g.beginPath(); g.arc(0, 0, Ri, 0, TAU); g.stroke();

    g.save(); g.beginPath(); g.arc(0, 0, Ri, 0, TAU); g.clip();
    if (mode === 'liquid') this._liquid(Ri, u);
    else if (mode === 'residue') { this._stains(Ri, 1); this._pileDraw(Ri, 1); }
    else this._interior(Ri, u);
    g.restore();
    // لمعة الحافة
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = W * .006; g.beginPath(); g.arc(0, 0, Rc * .96, Math.PI * 1.1, Math.PI * 1.42); g.stroke();
  }

  _liquid(Ri, u) {
    const g = this.g, W = this.W, t = this.time, lev = 1 - ease(u), Rl = Ri * (.08 + .92 * lev);
    // أثر القهوة على الجدار
    if (u > 0) this._stains(Ri, ease(u));
    g.save(); g.beginPath(); g.arc(0, 0, Rl, 0, TAU); g.clip();
    let gr = g.createRadialGradient(0, 0, 0, 0, 0, Rl);
    gr.addColorStop(0, '#120803'); gr.addColorStop(.7, '#1d0d05'); gr.addColorStop(1, '#3a1d0b'); g.fillStyle = gr; g.fillRect(-Ri, -Ri, Ri * 2, Ri * 2);
    // الزَّبَد
    const sw = (u > 0 ? t * 4 : t) * .35;
    for (const b of this.blobs) {
      const a = b.a + sw * b.sp * 2 + t * b.sp * .5, r = b.r * W * (u > 0 ? lev : 1), x = Math.cos(a) * r, y = Math.sin(a) * r;
      gr = g.createRadialGradient(x, y, 0, x, y, b.s * W * 2.2);
      gr.addColorStop(0, `rgba(190,120,60,${b.o * .8})`); gr.addColorStop(1, 'rgba(190,120,60,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, b.s * W * 2.2, 0, TAU); g.fill();
    }
    g.fillStyle = 'rgba(120,70,30,.26)'; g.beginPath(); g.arc(0, 0, Rl, 0, TAU); g.arc(0, 0, Rl * .78, 0, TAU, true); g.fill();
    for (const b of this.bubs) {
      const a = b.a + t * b.sp, r = b.r * W * (u > 0 ? lev : 1), x = Math.cos(a) * r, y = Math.sin(a) * r, s = b.s * W;
      if (Math.hypot(x, y) > Rl * .96) continue;
      g.strokeStyle = 'rgba(240,190,120,.55)'; g.lineWidth = Math.max(1, s * .25); g.beginPath(); g.arc(x, y, s, 0, TAU); g.stroke();
      g.fillStyle = 'rgba(255,230,190,.5)'; g.beginPath(); g.arc(x - s * .3, y - s * .3, s * .3, 0, TAU); g.fill();
    }
    // لمعة سطحية
    gr = g.createLinearGradient(-Rl, -Rl, Rl, Rl); gr.addColorStop(0, 'rgba(255,255,255,.14)'); gr.addColorStop(.4, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(-Rl, -Rl, Rl * 2, Rl * 2);
    g.restore();
    g.strokeStyle = 'rgba(60,30,10,.5)'; g.lineWidth = W * .003; g.beginPath(); g.arc(0, 0, Rl, 0, TAU); g.stroke();
    // ثُفل يتجمع في القاع أثناء الشرب
    if (u > .6) { g.fillStyle = `rgba(35,17,7,${(u - .6) * 2})`; this._blob(Ri * .09, 0); }
  }

  _blob(r, jit) { const g = this.g; g.beginPath(); this.pile && this.pile.forEach((p, i) => { const rr = r * (.8 + p.r * 5) * (1 + jit * Math.sin(i * 2)); const x = Math.cos(p.a) * rr, y = Math.sin(p.a) * rr; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.fill(); }

  _stains(Ri, k) { // حلقات بنّيّة باهتة على الجدار
    const g = this.g, rings = this.rings || [.2, .26, .3];
    for (const r of rings) { g.strokeStyle = `rgba(120,70,30,${.16 * k})`; g.lineWidth = this.W * .006; g.beginPath(); g.arc(0, 0, r * this.W * 1.08, 0, TAU); g.stroke(); }
    const gr = g.createRadialGradient(0, 0, Ri * .5, 0, 0, Ri); gr.addColorStop(0, 'rgba(150,95,45,0)'); gr.addColorStop(1, `rgba(150,95,45,${.22 * k})`); g.fillStyle = gr; g.fillRect(-Ri, -Ri, Ri * 2, Ri * 2);
  }
  _pileDraw(Ri, k) { const g = this.g; g.fillStyle = `rgba(36,18,8,${.95 * k})`; this._blob(Ri * .11, .12); }

  _interior(Ri, u) { // الثُّفل يسيل من القاع نحو الحافة
    const g = this.g, W = this.W;
    this._stains(Ri, 1);
    // ظلّ متدرّج من الوسط
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, Ri * .5); gr.addColorStop(0, 'rgba(70,38,16,.5)'); gr.addColorStop(1, 'rgba(70,38,16,0)'); g.fillStyle = gr; g.fillRect(-Ri, -Ri, Ri * 2, Ri * 2);
    g.lineCap = 'round'; g.lineJoin = 'round';
    const e = ease(u);
    for (const d of this.drips) {
      const n = Math.max(2, Math.floor(d.pts.length * e)), pts = d.pts;
      for (let pass = 0; pass < 2; pass++) {
        g.strokeStyle = pass ? `rgba(40,20,8,${d.al})` : `rgba(90,52,22,${d.al * .45})`; g.lineWidth = d.w * (pass ? 1 : 2.4) * W / 760;
        g.beginPath();
        for (let k = 0; k < n; k++) { const [a, r] = pts[k], x = Math.cos(a) * r * W, y = Math.sin(a) * r * W; k ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.stroke();
      }
      if (d.branch && n > d.branch.at) { const [a0, r0] = pts[d.branch.at]; g.strokeStyle = `rgba(40,20,8,${d.al * .8})`; g.lineWidth = d.w * .55 * W / 760; g.beginPath(); g.moveTo(Math.cos(a0) * r0 * W, Math.sin(a0) * r0 * W); const bl = d.branch.l * e; g.lineTo(Math.cos(a0 + d.branch.da) * (r0 + bl) * W, Math.sin(a0 + d.branch.da) * (r0 + bl) * W); g.stroke(); }
    }
    for (const gr_ of this.grains) { if (gr_.r > .03 + e * .28) continue; g.fillStyle = `rgba(30,15,6,${gr_.al})`; g.beginPath(); g.arc(Math.cos(gr_.a) * gr_.r * W, Math.sin(gr_.a) * gr_.r * W, gr_.s * W, 0, TAU); g.fill(); }
    this._pileDraw(Ri, 1);
  }

  _symbols(u) {
    const g = this.g, W = this.W;
    this.symbols.forEach((s, i) => {
      const k = clamp(u * 3 - i * .8), x = Math.cos(s.a) * s.r * W, y = Math.sin(s.a) * s.r * W, sz = s.s * W * (.6 + .4 * ease(k));
      if (k <= 0) return;
      g.save(); g.translate(x, y); g.rotate(s.rot);
      // هالة ذهبية خافتة ثم الرمز
      const gl = g.createRadialGradient(0, 0, 0, 0, 0, sz * 2.2); gl.addColorStop(0, `rgba(236,198,128,${.4 * k})`); gl.addColorStop(1, 'rgba(236,198,128,0)'); g.fillStyle = gl; g.beginPath(); g.arc(0, 0, sz * 2.2, 0, TAU); g.fill();
      g.scale(sz, sz); g.lineWidth = .2; g.lineCap = 'round'; g.lineJoin = 'round';
      g.strokeStyle = `rgba(36,16,6,${.92 * k})`; g.fillStyle = `rgba(36,16,6,${.92 * k})`;
      DRAW[s.key](g); g.restore();
      // شارة الرقم
      const bx = x + Math.cos(s.a) * sz * 1.7, by = y + Math.sin(s.a) * sz * 1.7;
      g.fillStyle = `rgba(217,164,65,${k})`; g.beginPath(); g.arc(bx, by, W * .021, 0, TAU); g.fill();
      g.fillStyle = `rgba(26,18,8,${k})`; g.font = `700 ${W * .026}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(i + 1), bx, by + 1);
    });
  }
}
