/*
  رحلة البنّ: حبّة هال ← تحميص ← طحن ← الدلّة على الجمر ← الصبّ ← طقس الضيافة (الفنجان لا ينتهي حتى تهزّه).
  التقدّم p مرتبط بالتمرير (مع قصور ذاتي سينمائي)، ومشهد الضيافة الأخير تفاعلي زمنياً.
*/
import * as THREE from 'three';
import { Stage, smooth, lerp, clamp } from './core.js';
import * as O from './objects.js';
import { drawMark } from '../brand.js';

const T = new THREE.Vector3(130, 0, 0);       // محطة الطاولة
const B = new THREE.Vector3(46, 0, 0);        // محطة البنّ
const CUP = new THREE.Vector3(T.x + 32, 0.35, 0);
const POT_REST = new THREE.Vector3(T.x, 6.3, 0);
const BEAN_S = 3.4;

/* مفاتيح الكاميرا: [p, هدف x,y,z, نصف القطر, السمت°, الارتفاع°, FOV] */
const KEYS = [
  [0.00, 0, 0, 0, 17, -14, 7, 30],
  [0.06, 0, 0.2, 0, 13, 22, 12, 30],
  [0.12, 0, 0.2, 0, 12, 54, 10, 30],
  [0.17, 46, 0, 0, 34, 8, 8, 30],
  [0.22, 46, 0, 0, 21, -22, 10, 30],
  [0.32, 46, 0, 0, 15, 24, 14, 30],
  [0.385, 46, 0, 0, 19, 6, 8, 30],
  [0.45, 92, 20, 0, 64, -8, 12, 34],
  [0.505, T.x + 10, 15, 0, 66, 10, 13, 30],
  [0.565, CUP.x - 6, 8, 0, 40, -18, 14, 30],
  [0.625, CUP.x, 4, 0, 23, -32, 10, 30],
  [0.685, CUP.x, 4.6, 0, 25, 6, 14, 30],
  [0.75, CUP.x, 5, 0, 22, -4, 22, 30],
  [0.85, CUP.x, 3.2, 0, 18, 0, 36, 29],
  [1.00, CUP.x, 2.8, 0, 25, 0, 42, 28]
];
const CH = [0.0, 0.135, 0.385, 0.5, 0.665, 0.9];   // بدايات الفصول
const ROAST_T = [[0, 25], [0.22, 150], [0.42, 196], [0.65, 210], [0.85, 224], [1, 236]];

function tempOf(r) { for (let i = 0; i < ROAST_T.length - 1; i++) if (r <= ROAST_T[i + 1][0]) { const a = ROAST_T[i], b = ROAST_T[i + 1]; return lerp(a[1], b[1], (r - a[0]) / (b[0] - a[0])); } return 236; }
function stageOf(r) { return r < 0.2 ? 0 : r < 0.36 ? 1 : r < 0.55 ? 2 : r < 0.78 ? 3 : r < 0.92 ? 4 : 5; }

export class Story {
  constructor({ canvas, section, ui, sfx, mobile, preserve }) {
    this.ui = ui; this.section = section; this.sfx = sfx; this.mobile = mobile;
    this.stage = new Stage(canvas, { mobile, preserve });
    this.p = 0; this.ps = 0; this.forceP = null; this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    this.cer = { active: false, done: false, phase: 'fill', t: 0, cups: 0, pourAmt: 0, lift: 0, level: 0, streamOn: false, ret: 0, cupX: 0, cupV: 0, rot: 0, slosh: new THREE.Vector2(), sloshV: new THREE.Vector2(), shakes: [], meter: 0, shakeEnergy: 0, sipLift: 0 };
    this.locked = false; this.tail = 0.5; this._autoPending = false; this.lastCh = -1; this.crackA = false; this.crackB = false; this.roast = 0;
    this._build();
    this._warm();
    this.stage.add((dt, t) => this._frame(dt, t));
    this._bindInput();
    this._measure();
    this._on('resize', () => this._measure());
  }
  /* مستمعو النافذة مسجَّلون كي يُزالوا عند التفريغ */
  _on(type, fn, opt) { (this._ls = this._ls || []).push([type, fn, opt]); addEventListener(type, fn, opt); }

  /* ------------------------------------------------------------ بناء المشهد */
  _build() {
    const S = this.stage, sc = S.scene;
    // حبّات الهال
    this.pods = [];
    const mk = (pos, sc_, rot) => { const g = O.makePod(); g.position.copy(pos); g.scale.setScalar(sc_); g.rotation.set(rot[0], rot[1], rot[2]); sc.add(g); this.pods.push({ g, base: pos.clone(), s: sc_, ph: Math.random() * 6 }); return g; };
    mk(new THREE.Vector3(0, 0, 0), 1.75, [0.3, 0, 0.35]);
    mk(new THREE.Vector3(5.2, -2.4, -3.5), 1.25, [-0.5, 0.8, -0.4]);
    mk(new THREE.Vector3(-5.0, 2.2, -5), 1.1, [0.7, -0.4, 0.6]);
    this.seeds = O.makeSeeds(10); this.seeds.scale.setScalar(1.0); this.seeds.children.forEach((m, i) => m.position.set((Math.random() - .5) * 11, (Math.random() - .5) * 6 - 1, (Math.random() - .5) * 6 + 1)); sc.add(this.seeds);
    this.podGlow = O.glowSprite(0xffb55a, 34, 0.5); this.podGlow.position.set(0, 0, -9); sc.add(this.podGlow);
    // حبّة البنّ
    this.bean = O.makeBean(); this.bean.mesh.position.copy(B); this.bean.mesh.scale.setScalar(BEAN_S); sc.add(this.bean.mesh);
    this.beanGlow = O.glowSprite(0xff8a30, 40, 0.0); this.beanGlow.position.set(B.x, B.y, B.z - 9); sc.add(this.beanGlow);
    // غبار الطحن
    this.powder = O.makePowder(this.mobile ? 3200 : 5500, B, BEAN_S, new THREE.Vector3(T.x, 31, 0)); sc.add(this.powder);
    // الطاولة
    this.floor = O.makeStoneFloor(78); this.floor.position.set(T.x + 14, 0, 0); sc.add(this.floor);
    this.brazier = O.makeBrazier(); this.brazier.group.position.copy(T); sc.add(this.brazier.group);
    this.pot = O.makePot(); this.pot.group.position.copy(POT_REST); sc.add(this.pot.group);
    this.tray = O.makeTray(8.6); this.tray.position.set(CUP.x, 0, 0); sc.add(this.tray);
    this.finjan = O.makeFinjan((g, x, y, r) => drawMark(g, x, y, r, '#c99a46'));
    this.finjan.group.position.copy(CUP); sc.add(this.finjan.group);
    this.stream = O.makeStream(); sc.add(this.stream);
    this.embers = O.makeEmbers(this.mobile ? 40 : 70); this.embers.position.copy(T); sc.add(this.embers);
    this.potSteam = O.makeSteam(this.mobile ? 28 : 46, 26, 2.4, 3.6); sc.add(this.potSteam);
    this.lidSteam = O.makeSteam(this.mobile ? 24 : 38, 20, 4, 6); sc.add(this.lidSteam);
    this.cupSteam = O.makeSteam(this.mobile ? 24 : 42, 17, 2.2, 2.6); sc.add(this.cupSteam);
    const b1 = O.softBlob(40, 0.7); b1.position.set(T.x, 0.05, 0); sc.add(b1); this.b1 = b1;
    const b2 = O.softBlob(15, 0.75); b2.position.set(CUP.x, 0.06, 0); sc.add(b2); this.b2 = b2;
    this._spinQ = new THREE.Quaternion(); this._spinAxis = new THREE.Vector3(0.6, 1, 0.3).normalize();
    // حبوب البنّ المتناثرة حول الفنجان + هيل وبذور
    this.nBeans = this.mobile ? 18 : 24;
    this.beans = O.makeBeanField(this.nBeans); sc.add(this.beans);
    this.beanRest = [];
    const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), ax = new THREE.Vector3(1, 0, 0), ay = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < this.nBeans; i++) {
      const a = Math.random() * Math.PI * 2, rad = 7.0 + Math.pow(Math.random(), 0.75) * 11;
      const onTray = rad < 8.3, up = Math.random() > 0.22;
      const s_ = 0.72 * (0.9 + Math.random() * 0.28);
      qa.setFromAxisAngle(ax, up ? -Math.PI / 2 + (Math.random() - .5) * 0.25 : Math.PI / 2 + (Math.random() - .5) * 0.25);
      qb.setFromAxisAngle(ay, Math.random() * Math.PI * 2); qb.multiply(qa);
      this.beanRest.push({ x: CUP.x + Math.cos(a) * rad * 1.12, z: Math.sin(a) * rad * 0.85, y: (onTray ? 0.35 : 0) + 0.3 * s_ / 0.62 * (up ? 0.9 : 1) * 0.86, q: qb.clone(), s: s_, t0: 0.5 + i * 0.0028 + Math.random() * 0.02 });
    }
    this._dm = new THREE.Matrix4(); this._dq = new THREE.Quaternion(); this._dp = new THREE.Vector3(); this._ds = new THREE.Vector3();
    this.decor = new THREE.Group(); sc.add(this.decor);
    [[10.5, 6.5, 0.9], [-9.5, 8.5, 2.2], [3.5, -11, 4.0], [-4.5, 12, 5.1]].forEach(([dx, dz, ry], i) => {
      const g = O.makePod(true); g.scale.setScalar(1.05); g.position.set(CUP.x + dx, 1.15, dz); g.rotation.set(0.1, ry, 0.15); g.userData = { t0: 0.52 + i * 0.012, y: 1.15 }; this.decor.add(g);
    });
    const sd = O.makeSeeds(7); sd.children.forEach((m, i) => { m.scale.setScalar(0.75); m.position.set(CUP.x + (Math.random() - .5) * 28, 0.2, (Math.random() - .5) * 20); m.userData = { t0: 0.53 + i * 0.01, y: 0.2 }; this.decor.add(m); });
    // حبّات الهال التي تسقط في الدلّة
    this.drops = [0, 1, 2].map(i => { const g = O.makePod(true); g.scale.setScalar(1.15); g.visible = false; g.userData = { i }; sc.add(g); return g; });
    sc.fog = null;
  }

  /* تسخين مسبق: يُترجَم كل شيدر ويُرفع كل نسيج وكل شكل مرة واحدة أثناء التحميل (ولا يحدث تقطيع عند الوصول لمحطة جديدة).
     بعدها تُخفى العناصر غير اللازمة لكل فصل؛ ضوء الجمر يُترجم بحالتيه (ظاهر/مخفي) فلا يُعاد ترجمة الشيدرات عند تبديله. */
  _warm() {
    const S = this.stage, sc = S.scene, cam = S.camera, r = S.renderer, hid = [], cull = [];
    S.canvas.style.visibility = 'hidden';
    sc.traverse(o => { if (!o.visible) hid.push(o); o.visible = true; if (o.frustumCulled) { cull.push(o); o.frustumCulled = false; } });
    try {
      r.compile(sc, cam);
      sc.traverse(o => { const m = o.material; if (!m) return; for (const mm of (Array.isArray(m) ? m : [m])) for (const k in mm) { const v = mm[k]; if (v && v.isTexture) r.initTexture(v); } });
      r.render(sc, cam);                                   // يرفع كل الأشكال إلى الذاكرة
      this.brazier.light.visible = false; r.compile(sc, cam); r.render(sc, cam);   // حالة بلا ضوء الجمر
      this.brazier.light.visible = true;
      r.clear();
    } catch (e) { /* التسخين اختياري */ }
    for (const o of cull) o.frustumCulled = true;
    for (const o of hid) o.visible = false;
  }

  /* ------------------------------------------------------------ الإدخال */
  _bindInput() {
    const M = this.mouse;
    this._on('pointermove', (e) => {
      const nx = e.clientX / innerWidth, ny = e.clientY / innerHeight;
      M.tx = (nx - 0.5) * 2; M.ty = (ny - 0.5) * 2;
      this._shakeSample(e.clientX);
    }, { passive: true });
    this._on('touchmove', (e) => { if (e.touches[0]) this._shakeSample(e.touches[0].clientX); }, { passive: true });
    this._on('devicemotion', (e) => {
      const a = e.accelerationIncludingGravity; if (!a || !this.cer.active || this.cer.done) return;
      const m = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
      if (this._lastAcc !== undefined && Math.abs(m - this._lastAcc) > 9) this._shakeCount();
      this._lastAcc = m;
    });
    this._on('keydown', (e) => {
      if (this.cer.active && !this.cer.done && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        if (this._lastArrow && this._lastArrow !== e.key) this._shakeCount(); this._lastArrow = e.key;
      }
    });
  }

  /* مستشعر الهزّ: انعكاسات اتجاه الإصبع/الفأرة الأفقي */
  _shakeSample(x) {
    const c = this.cer; if (!c.active || c.done) { this._sx = x; return; }
    if (this._sx === undefined) { this._sx = x; this._anchor = x; this._dir = 0; return; }
    const dx = x - this._sx; this._sx = x;
    if (Math.abs(dx) < 1) return;
    const d = dx > 0 ? 1 : -1;
    if (d !== this._dir) { if (this._dir !== 0 && Math.abs(this._extreme - this._anchor) > Math.max(46, innerWidth * 0.04)) this._shakeCount(); this._anchor = x; this._dir = d; }
    this._extreme = x;
    c.shakeEnergy = Math.min(1, c.shakeEnergy + Math.abs(dx) / 900);
  }
  _shakeCount() {
    const c = this.cer, now = performance.now(); c.shakes.push(now);
    c.shakes = c.shakes.filter(t => now - t < 2000);
    this.sfx.rattle(); c.meter = Math.min(1, c.shakes.length / 5);
    if (c.shakes.length >= 5) this.finishCeremony();
  }
  /* التمرير نفسه يهزّ الفنجان: إن تابع الزائر النزول بعد وصول الرحلة لنهايتها يهتزّ الفنجان تلقائياً ثم تُفتح الصفحة له */
  autoShake() {
    const c = this.cer; if (!c.active || c.done || this._autoPending) return;
    this._autoPending = true; this._autoShake = 1.0; this.sfx.rattle(); setTimeout(() => { this.finishCeremony(); this._autoPending = false; }, 650);
  }
  manualShake() { // زر "هزّ" لمن لا يملك فأرة/حسّاساً
    const c = this.cer; if (!c.active || c.done) return;
    this._autoShake = 1.2; this.sfx.rattle(); setTimeout(() => this.finishCeremony(), 900);
  }
  finishCeremony(skip = false) {
    const c = this.cer; if (c.done) return;
    c.done = true; c.streamOn = false; this.locked = false; c.retT = 0; c.shakes = []; c.meter = 1;
    if (!skip) this.sfx.done();
    this.ui.onDone && this.ui.onDone(true);
    if (skip) { c.ret = 1; c.level = 0.33; c.pourAmt = 0; }
  }

  _measure() {
    const r = this.section.getBoundingClientRect();
    this.secTop = scrollY + r.top; this.secH = this.section.offsetHeight; this.vh = innerHeight;
    this.span = Math.max(1, this.secH - this.vh * (1 + this.tail));    // آخر نصف شاشة يبقى فيها المشهد ثابتاً بعد اكتمال p
    this.lockY = this.secTop + this.span;                              // موضع التمرير الذي يبلغ عنده p القيمة 1
  }

  /* ------------------------------------------------------------ تحديث */
  setP(p, instant) { this.forceP = p; if (instant) this.ps = p; }
  readScroll() {
    return clamp((scrollY - this.secTop) / this.span);
  }

  _cam() {
    const ps = this.ps; let i = 0; while (i < KEYS.length - 2 && ps > KEYS[i + 1][0]) i++;
    const a = KEYS[i], b = KEYS[i + 1], t = smooth(a[0], b[0], ps), e = t;
    const tx = lerp(a[1], b[1], e), ty = lerp(a[2], b[2], e), tz = lerp(a[3], b[3], e), r = lerp(a[4], b[4], e);
    const az = lerp(a[5], b[5], e) * Math.PI / 180, el = lerp(a[6], b[6], e) * Math.PI / 180, fov = lerp(a[7], b[7], e);
    const cam = this.stage.camera, M = this.mouse;
    const k = this.mobile ? 0 : 1;
    let px = tx + r * Math.sin(az) * Math.cos(el) + M.x * r * 0.035 * k, py = ty + r * Math.sin(el) - M.y * r * 0.02 * k, pz = tz + r * Math.cos(az) * Math.cos(el);
    // اهتزاز خفيف عند الهزّ الناجح
    if (this._shakeCam > 0) { px += Math.sin(this.stage.time * 70) * this._shakeCam * 0.25; py += Math.cos(this.stage.time * 61) * this._shakeCam * 0.18; }
    cam.position.set(px, py, pz); cam.lookAt(tx, ty, tz); this.stage.setFov(fov);
    const st = this.stage;
    if (st.w / st.h <= 1.15) { const oy = lerp(0.1, 0.27, smooth(0.8, 0.95, ps)); cam.setViewOffset(st.w, st.h, 0, st.h * oy, st.w, st.h); cam.updateProjectionMatrix(); }
    this.stage.key.position.set(tx - 30, ty + 40, tz + 40); this.stage.keyTarget.position.set(tx, ty, tz);
  }

  _frame(dt, time) {
    const S = this.stage, c = this.cer, M = this.mouse;
    // التقدّم
    const target = this.forceP !== null ? this.forceP : this.readScroll();
    this.p = target;
    const k = this.reduced ? 1 : 1 - Math.exp(-dt * 4.2);
    this.ps += (target - this.ps) * k; if (Math.abs(target - this.ps) < 1e-4) this.ps = target;
    const p = this.ps;
    if (this.forceP === null && c.active && !c.done && scrollY > this.lockY + this.vh * 0.1) this.autoShake();
    M.x += (M.tx - M.x) * (1 - Math.exp(-dt * 3)); M.y += (M.ty - M.y) * (1 - Math.exp(-dt * 3));
    if (this._shakeCam > 0) this._shakeCam = Math.max(0, this._shakeCam - dt * 3);

    // ---- الفصل الحالي
    let ch = 0; for (let i = 0; i < CH.length; i++) if (p >= CH[i] - 1e-6) ch = i;
    if (ch !== this.lastCh) { this.lastCh = ch; this.ui.onChapter && this.ui.onChapter(ch); }

    // ---- الهال
    const podVis = p < 0.2;
    for (const o of this.pods) {
      o.g.visible = podVis; if (!podVis) continue;
      const out = 1 - smooth(0.115, 0.17, p);
      o.g.scale.setScalar(o.s * Math.max(0.0001, out));
      o.g.rotation.y += dt * (0.35 + o.ph * 0.02) + (p < 0.12 ? 0 : 0.0);
      o.g.rotation.z += dt * 0.12 * (o.ph > 3 ? -1 : 1);
      o.g.position.set(o.base.x, o.base.y + Math.sin(time * 0.8 + o.ph) * 0.25, o.base.z);
    }
    this.podGlow.visible = podVis; this.podGlow.material.opacity = 0.5 * (1 - smooth(0.1, 0.17, p));
    this.seeds.visible = podVis; this.seeds.scale.setScalar(1.0 * Math.max(0.0001, 1 - smooth(0.115, 0.17, p)));
    if (podVis) this.seeds.children.forEach((m, i) => { m.rotation.x += dt * 0.3; m.rotation.y += dt * (0.2 + i * 0.02); });

    // ---- الحبّة والتحميص
    const beanVis = p > 0.1 && p < 0.42;
    this.bean.mesh.visible = beanVis;
    const roast = smooth(0.2, 0.37, p); this.roast = roast;
    if (beanVis) {
      const appear = smooth(0.12, 0.2, p), shatter = 1 - smooth(0.385, 0.405, p);
      const crackPulse = Math.max(Math.exp(-Math.pow((roast - 0.42) * 38, 2)), Math.exp(-Math.pow((roast - 0.86) * 38, 2)));
      this.bean.setRoast(roast); this.bean.setCrack(crackPulse); this.bean.setTime(time);
      this.bean.mesh.scale.setScalar(BEAN_S * appear * Math.max(0.001, shatter) * (1 + crackPulse * 0.05));
      this.bean.mesh.rotation.set(-0.3 + Math.sin(time * 0.5) * 0.08, Math.sin(time * 0.33) * 0.42 + p * 0.5, 0.42 + Math.sin(time * 0.27) * 0.1);
      this.bean.mesh.position.set(B.x, B.y + Math.sin(time * 1.1) * 0.12, B.z);
    }
    this.beanGlow.visible = beanVis;
    this.beanGlow.material.opacity = (0.08 + 0.38 * roast) * smooth(0.12, 0.2, p) * (1 - smooth(0.385, 0.42, p));
    // أصوات الطقطقة عند عبور عتبتين (بالاتجاهين)
    if (roast > 0.42 && !this.crackA) { this.crackA = true; this._crackBurst(5, 1); } else if (roast < 0.4) this.crackA = false;
    if (roast > 0.86 && !this.crackB) { this.crackB = true; this._crackBurst(9, 0.7); } else if (roast < 0.84) this.crackB = false;
    this.sfx.roar(beanVis && p > 0.2 && p < 0.39 ? 0.5 + roast * 0.5 : 0);
    // HUD التحميص
    this.ui.onRoast && this.ui.onRoast(tempOf(roast), stageOf(roast), roast, beanVis && p > 0.14 && p < 0.39);

    // ---- الطحن / الغبار
    const flow = smooth(0.39, 0.515, p);
    const pu = this.powder.material.uniforms;
    pu.uFlow.value = flow; pu.uTime.value = time; pu.uShow.value = smooth(0.375, 0.395, p) * (1 - smooth(0.51, 0.535, p)); pu.uPx.value = S.quality.dpr;
    this.powder.visible = p > 0.36 && p < 0.56;
    this.sfx.grind(p > 0.385 && p < 0.49 ? 0.6 : 0);

    // ---- المجمر والدلّة
    const floorA = smooth(0.4, 0.47, p); this.floor.visible = floorA > 0.01; this.floor.material.opacity = floorA;
    // إخفاء ما لا يلزم: عناصر الطاولة لا تُرسم قبل الاقتراب منها، والدلّة لا تُرسم أثناء لقطات الفنجان القريبة
    const tbl = p > 0.4, potNeeded = tbl && (p < 0.585 || p > 0.615);
    for (const c of this.brazier.group.children) if (c !== this.brazier.light) c.visible = tbl;
    this.brazier.light.visible = tbl;
    this.pot.group.visible = potNeeded; this.tray.visible = tbl; this.finjan.group.visible = tbl; this.embers.visible = tbl; this.b1.visible = tbl; this.b2.visible = tbl;
    const heat = smooth(0.44, 0.52, p);
    this.brazier.coalMat.uniforms.uTime.value = time; this.brazier.coalMat.uniforms.uHeat.value = 0.55 + 0.6 * heat;
    this.brazier.light.intensity = (50 + 70 * heat) * (0.9 + 0.1 * Math.sin(time * 7) * Math.sin(time * 3.1));
    this.embers.material.uniforms.uTime.value = time; this.embers.material.uniforms.uAmt.value = 0.25 + heat * 0.9; this.embers.material.uniforms.uPx.value = S.quality.dpr;

    // الغطاء وحبّات الهال
    const lidOpen = smooth(0.505, 0.518, p) * (1 - smooth(0.552, 0.566, p));
    this.pot.lidPivot.rotation.z = lidOpen * 1.15;
    this.drops.forEach((g, i) => {
      const t0 = 0.514 + i * 0.01, tt = clamp((p - t0) / 0.03);
      g.visible = tt > 0 && tt < 1 && p < 0.56;
      if (g.visible) {
        const y = lerp(60, 26, tt * tt * 0.9 + tt * 0.1);
        g.position.set(T.x - 0.8 + (i - 1) * 1.6, y, (i - 1) * 0.8 + Math.sin(tt * 6) * 0.2);
        g.rotation.set(tt * 8 + i, tt * 5, tt * 3);
      }
    });
    // الغليان
    const boil = smooth(0.48, 0.54, p) * (1 - smooth(0.6, 0.66, p));
    this.sfx.bubble(boil * 0.9);

    // ---- حبوب البنّ تتساقط حول الفنجان + الهيل والبذور
    this._dropBeans(p);

    // ---- الصبّ + الطقس
    this._pourAndCeremony(dt, time, p);

    // ---- البخار
    const su = (m, amt) => { m.visible = tbl && amt > 0.01; if (!m.visible) return; m.material.uniforms.uTime.value = time; m.material.uniforms.uAmt.value = amt; m.material.uniforms.uPx.value = S.quality.dpr; };
    const steamPot = smooth(0.46, 0.54, p);
    su(this.potSteam, steamPot * (1 - smooth(0.58, 0.64, p) * 0.7));
    su(this.lidSteam, steamPot * (0.5 + 0.8 * lidOpen) * (1 - smooth(0.56, 0.64, p)));
    su(this.cupSteam, smooth(0.78, 0.86, p) * (c.level > 0.05 ? 1.7 : 0.3));

    // ---- الخلفية
    this._tint(p);
    this._cam();
    this.ui.onProgress && this.ui.onProgress(p, ch);
    if (this.stage.canvas.style.visibility === 'hidden') this.stage.canvas.style.visibility = '';
  }

  _bounce(t) { // easeOutBounce
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75; }
    if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375; }
    t -= 2.625 / 2.75; return 7.5625 * t * t + 0.984375;
  }
  _dropBeans(p) {
    const show = p > 0.495; this.beans.visible = show; this.decor.visible = show;
    if (!show) return;
    const m = this._dm, q = this._dq, v = this._dp, sc = this._ds, spin = this._spinQ, axis = this._spinAxis;
    for (let i = 0; i < this.nBeans; i++) {
      const r = this.beanRest[i], t = clamp((p - r.t0) / 0.05);
      if (t <= 0) { m.makeScale(0, 0, 0); this.beans.setMatrixAt(i, m); continue; }
      const e = this._bounce(t), h = (1 - e) * 42;
      spin.setFromAxisAngle(axis, (1 - e) * (i % 2 ? 5 : -4)); q.copy(spin).multiply(r.q);
      v.set(r.x, r.y + h, r.z); sc.setScalar(r.s); m.compose(v, q, sc); this.beans.setMatrixAt(i, m);
    }
    this.beans.instanceMatrix.needsUpdate = true;
    for (const g of this.decor.children) {
      const t = clamp((p - g.userData.t0) / 0.05), e = this._bounce(t);
      g.visible = t > 0; g.position.y = g.userData.y + (1 - e) * 40;
    }
  }

  _crackBurst(n, big) {
    for (let i = 0; i < n; i++) setTimeout(() => this.sfx.crack(big * (0.6 + Math.random() * 0.6)), i * (60 + Math.random() * 90));
  }

  /* ------------------------------------------------------------ الدلّة: وضعية الصبّ + طقس الضيافة */
  _placePot(lift, pourAmt, cupX) {
    const pg = this.pot.group, tl = this.pot.tipLocal;
    const rotZ = lerp(0, lerp(-0.36, -1.08, pourAmt), smooth(0, 1, lift));
    const tipTarget = new THREE.Vector3(cupX + lerp(-2, 0, pourAmt), CUP.y + 4.8 + lerp(26, 9.4, pourAmt), 0);
    const c = Math.cos(rotZ), s = Math.sin(rotZ);
    const hover = new THREE.Vector3(tipTarget.x - (tl.x * c - tl.y * s), tipTarget.y - (tl.x * s + tl.y * c), 0);
    const l = smooth(0, 1, lift);
    pg.position.set(lerp(POT_REST.x, hover.x, l), lerp(POT_REST.y, hover.y, l) + Math.sin(Math.PI * l) * 9, 0);
    pg.rotation.z = rotZ;
    // موضع الصبّة في العالم
    pg.updateMatrixWorld(true);
    return pg.localToWorld(tl.clone());
  }

  _pourAndCeremony(dt, time, p) {
    const c = this.cer, S = this.stage, tbl2 = p > 0.4;
    const inCer = p >= 0.975 && this.forceP === null || (this.forceP !== null && this.forceP >= 0.975);
    if (inCer && !c.active) { c.active = true; c.phase = 'fill'; c.t = 0; c.cups = 0; c.level = 0; this.ui.onCups && this.ui.onCups(0, false); }
    if (!inCer && c.active) { c.active = false; this._autoPending = false; }
    if (!inCer && c.done && p < 0.9) { c.done = false; c.ret = 0; c.meter = 0; this.ui.onDone && this.ui.onDone(false); }

    let lift, pourAmt, level, streamOn;
    if (!c.active) {
      lift = smooth(0.64, 0.72, p);
      pourAmt = smooth(0.66, 0.725, p) * (1 - 0.62 * smooth(0.845, 0.9, p));
      level = 0.33 * smooth(0.73, 0.84, p);
      streamOn = p > 0.725 && p < 0.84 && level < 0.329 && pourAmt > 0.9;
      c.level = level; c.pourAmt = pourAmt; c.lift = lift;
      c.cupX = lerp(c.cupX, 0, 0.2); c.rot = lerp(c.rot, 0, 0.2); c.sipLift = 0;
      if (c.done === false) c.ret = 0;
    } else {
      if (!c.done) {
        c.t += dt;
        const FILL = 1.9, HOLD = 1.0, SIP = 1.5, REST = 0.55;
        if (c.phase === 'fill') {
          c.pourAmt += ((c.t < 0.55 ? 1 : 1) - c.pourAmt) * (1 - Math.exp(-dt * 3.2));
          if (c.t > 0.7) { c.level = Math.min(0.33, c.level + dt / FILL * 0.33); c.streamOn = true; }
          if (c.level >= 0.33) { c.streamOn = false; c.phase = 'hold'; c.t = 0; }
        } else if (c.phase === 'hold') {
          c.pourAmt += (0.42 - c.pourAmt) * (1 - Math.exp(-dt * 2.2));
          if (c.t > HOLD) { c.phase = 'sip'; c.t = 0; this.sfx.sip(); }
        } else if (c.phase === 'sip') {
          const u = clamp(c.t / SIP); c.sipLift = Math.sin(Math.PI * u);
          c.level = lerp(0.33, 0.015, smooth(0.25, 0.8, u));
          c.pourAmt += (0.3 - c.pourAmt) * (1 - Math.exp(-dt * 2));
          if (u >= 1) { c.phase = 'rest'; c.t = 0; c.sipLift = 0; }
        } else if (c.phase === 'rest') {
          if (c.t > 0.55) { c.phase = 'fill'; c.t = 0; c.cups++; this.ui.onCups && this.ui.onCups(c.cups, true); }
        }
        if (c.phase === 'fill' && c.t < 0.02 && c.cups === 0 && !c._first) { c._first = true; this.ui.onCups && this.ui.onCups(0, true); }
        c.lift += (1 - c.lift) * (1 - Math.exp(-dt * 3));
        c.meter = Math.max(0, c.meter - dt * 0.22);
        c.shakeEnergy = Math.max(0, c.shakeEnergy - dt * 1.4);
        this.ui.onMeter && this.ui.onMeter(c.meter);
        // الفنجان يتبع المؤشر قليلاً + هزّ تلقائي
        const follow = this._autoShake > 0 ? Math.sin(time * 38) * 4.2 : clamp(this.mouse.x, -1, 1) * 2.4;
        this._autoShake = Math.max(0, (this._autoShake || 0) - dt);
        c.cupV += ((follow - c.cupX) * 90 - c.cupV * 11) * dt; c.cupX += c.cupV * dt;
        c.rot = clamp(c.cupV * -0.018, -0.35, 0.35);
        // ارتجاج السائل كنابض بسبب تسارع الفنجان
        c.sloshV.x += ((-c.slosh.x * 70 - c.sloshV.x * 5.5) + c.cupV * -0.06 * 70 * 0.03) * dt;
        c.slosh.x += c.sloshV.x * dt;
        c.sloshV.y += (-c.slosh.y * 70 - c.sloshV.y * 5.5) * dt; c.slosh.y += c.sloshV.y * dt;
        c.slosh.x = clamp(c.slosh.x, -0.5, 0.5);
        level = c.level; pourAmt = c.pourAmt; lift = c.lift; streamOn = c.streamOn;
      } else {
        // بعد النجاح: تعود الدلّة إلى الجمر ويبقى الفنجان ممتلئاً بالثلث
        c.ret = Math.min(1, c.ret + dt / 1.8);
        c.streamOn = false; c.level += (0.33 - c.level) * (1 - Math.exp(-dt * 3)); c.sipLift += (0 - c.sipLift) * (1 - Math.exp(-dt * 5));
        c.cupV += ((0 - c.cupX) * 60 - c.cupV * 9) * dt; c.cupX += c.cupV * dt; c.rot = lerp(c.rot, 0, 0.1);
        c.sloshV.x += (-c.slosh.x * 70 - c.sloshV.x * 5) * dt; c.slosh.x += c.sloshV.x * dt;
        lift = c.lift * (1 - smooth(0, 1, c.ret)); pourAmt = c.pourAmt * (1 - smooth(0, 0.6, c.ret)); level = c.level; streamOn = false;
        c.lift = lift;
      }
    }
    // تطبيق الوضعية
    const cupX = CUP.x + c.cupX;
    const tip = this._placePot(lift, pourAmt, CUP.x);
    const cg = this.finjan.group, lift2 = c.sipLift || 0;
    cg.position.set(cupX, CUP.y + lift2 * 4.0, lift2 * 5.5);
    cg.rotation.set(-lift2 * 0.55, 0, c.rot * (c.active ? 1 : 0));
    this.tray.position.x = CUP.x + c.cupX * 0.0;
    this.finjan.setLevel(level);
    this._imp = lerp(this._imp || 0, streamOn ? 1 : 0, 0.14);
    this.finjan.update(dt, time, c.slosh, Math.abs(c.cupV) * 0.02 + (streamOn ? 0.5 : 0), clamp(level * 3.4, 0, 0.92), this._imp);
    // خيط القهوة
    const st = this.stream, su = st.material.uniforms;
    su.uTime.value = time;
    const liqY = CUP.y + lerp(O.FINJAN_FLOOR, 4.6, level) + (c.sipLift || 0) * 4;
    su.uP0.value.copy(tip); su.uP2.value.set(cupX, liqY + 0.05, 0);
    su.uP1.value.set(tip.x + 1.6 * pourAmt, lerp(tip.y, liqY, 0.35), 0);
    if (streamOn) { this._head = Math.min(1, (this._head || 0) + dt * 5.5); this._tail = Math.max(0, (this._tail || 0) - dt * 8); }
    else { this._tail = Math.min(1, (this._tail || 0) + dt * 7); if (this._tail >= 1) this._head = 0; }
    su.uHead.value = this._head || 0; su.uTail.value = this._tail || 0;
    st.visible = tbl2 && (this._head || 0) > 0.01 && (this._tail || 0) < 0.99;
    this.sfx.pour(st.visible ? 0.85 : 0, level);
    // أماكن البخار
    this.potSteam.position.copy(tip); this.lidSteam.position.copy(this.pot.group.localToWorld(new THREE.Vector3(0, 29.5, 0)));
    this.cupSteam.position.set(cupX, CUP.y + 4.9 + (c.sipLift || 0) * 4, (c.sipLift || 0) * 5.5);
    // دمج الحالة للـ UI عند أول دخول
    if (c.done && !this._doneShown) { this._doneShown = true; this._shakeCam = 1; }
    if (!c.done) this._doneShown = false;
    this.locked = false;
  }

  /* ألوان الخلفية تتبدّل مع الفصول */
  _tint(p) {
    const stops = [
      [0.00, [28, 34, 28], [10, 9, 7], [0.5, 0.45], 0.30],
      [0.14, [44, 24, 12], [10, 7, 5], [0.55, 0.5], 0.42],
      [0.38, [38, 26, 14], [9, 7, 5], [0.5, 0.5], 0.30],
      [0.52, [26, 36, 31], [9, 10, 8], [0.5, 0.55], 0.32],
      [0.70, [24, 33, 29], [8, 9, 8], [0.52, 0.5], 0.34],
      [1.00, [30, 40, 34], [8, 9, 8], [0.5, 0.52], 0.38]
    ];
    let i = 0; while (i < stops.length - 2 && p > stops[i + 1][0]) i++;
    const a = stops[i], b = stops[i + 1], t = smooth(a[0], b[0], p);
    const mix = (x, y) => x.map((v, k) => Math.round(lerp(v, y[k], t)));
    const c1 = mix(a[1], b[1]), c2 = mix(a[2], b[2]);
    const el = this.section.style;
    el.setProperty('--g1', `${c1[0]},${c1[1]},${c1[2]}`); el.setProperty('--g2', `${c2[0]},${c2[1]},${c2[2]}`);
    el.setProperty('--gx', (lerp(a[3][0], b[3][0], t) * 100).toFixed(1) + '%'); el.setProperty('--gy', (lerp(a[3][1], b[3][1], t) * 100).toFixed(1) + '%');
  }

  start() { this.stage.start(); }
  stop() { this.stage.stop(); this.sfx.stopAll(); }
  /* تفريغ كامل من الذاكرة (يُستدعى حين نبتعد عن الهيرو بأكثر من شاشتين ونصف) */
  dispose() { this.stop(); (this._ls || []).forEach(([t, f, o]) => removeEventListener(t, f, o)); this._ls = []; this.stage.dispose(); if (window.__story === this) window.__story = null; }
  chapterY(i) { // موضع التمرير لبداية الفصل i
    return this.secTop + this.span * (CH[i] + (i === 0 ? 0 : 0.004));
  }
}
export { CH as CHAPTERS };
