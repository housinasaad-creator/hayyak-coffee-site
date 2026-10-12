/*
  نواة المشهد: renderer شفاف فوق خلفية CSS + بيئة انعكاسات استوديو دافئة + غبار عائم يتبع الكاميرا + مولّدات نسيج صغيرة.
  الوحدة: 1 = 1 سم تقريباً.
*/
import * as THREE from 'three';

export const PROJ = { value: 1000 };

export class Stage {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.mobile = !!opts.mobile;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.preserve });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);
    this.quality = { dpr: Math.min(window.devicePixelRatio || 1, this.mobile ? 1.5 : 2), level: 0 };
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(28, 1, 0.5, 600);
    this.scene.add(this.camera);
    this.time = 0;
    this.hooks = [];
    this.running = false;
    this._last = 0;
    this._ft = [];
    this.buildEnv();
    this.buildLights();
    this.buildDust();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  /* بيئة انعكاسات: صناديق ضوء دافئة + خضرة خافتة (على نمط الحساب المرجعي) + وهج جمر */
  buildEnv() {
    const s = new THREE.Scene();
    s.add(new THREE.Mesh(new THREE.SphereGeometry(80, 32, 16), new THREE.MeshBasicMaterial({ color: 0x120c07, side: THREE.BackSide })));
    const box = (w, h, pos, color, k) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(pos[0], pos[1], pos[2]); m.lookAt(0, 0, 0); s.add(m);
    };
    box(10, 22, [-22, 8, 14], 0xffe0b4, 4.2);     // مفتاح دافئ جانبي
    box(4, 28, [22, 6, 6], 0xcfe6ff, 3.6);        // حافة باردة خفيفة
    box(3, 28, [-14, 6, -20], 0xffc88c, 8);       // شريط خلفي
    box(24, 9, [0, 24, 4], 0xffffff, 2.3);        // سقف
    box(34, 9, [0, 0, -30], 0xff7a28, 2.4);       // وهج جمر بعيد
    box(24, 12, [2, 6, 30], 0xffe7cc, 1.1);       // تعبئة أمامية
    box(14, 10, [26, 8, 18], 0xdde8c8, 1.0);      // لمسة خضراء هيلية
    const pm = new THREE.PMREMGenerator(this.renderer);
    this.envRT = pm.fromScene(s, 0.03);
    pm.dispose();
    this.scene.environment = this.envRT.texture;
    this.scene.environmentIntensity = 1.0;
  }

  buildLights() {
    this.key = new THREE.DirectionalLight(0xffcf94, 2.6); this.key.position.set(-30, 40, 40);
    this.rim = new THREE.DirectionalLight(0xffb070, 3.0); this.rim.position.set(40, 22, -34);
    this.fill = new THREE.DirectionalLight(0xbfd3b0, 0.5); this.fill.position.set(36, 10, 40);
    this.scene.add(this.key, this.rim, this.fill, new THREE.AmbientLight(0x20140c, 0.8));
    this.keyTarget = this.key.target; this.scene.add(this.keyTarget);
  }

  /* غبار عائم داخل صندوق يتبع الكاميرا (يعطي إحساس السفر بين المحطات) */
  buildDust() {
    const n = this.mobile ? 260 : 520, box = new THREE.Vector3(120, 70, 90);
    const g = new THREE.BufferGeometry();
    const a = new Float32Array(n * 3), s = new Float32Array(n);
    for (let i = 0; i < n; i++) { a[i * 3] = Math.random() * box.x; a[i * 3 + 1] = Math.random() * box.y; a[i * 3 + 2] = Math.random() * box.z; s[i] = Math.random(); }
    g.setAttribute('position', new THREE.BufferAttribute(a, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(s, 1));
    this.dustMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uProj: PROJ, uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uBox: { value: box }, uPx: { value: 1 }, uTint: { value: new THREE.Color(1, .82, .52) }, uAmt: { value: 1 } },
      vertexShader: `
        uniform float uTime, uPx, uAmt, uProj; uniform vec3 uCam, uBox; attribute float aSeed; varying float vA;
        void main(){
          vec3 p = position + vec3(sin(uTime*.07+aSeed*40.)*3., uTime*(.5+aSeed*.7), cos(uTime*.05+aSeed*30.)*3.);
          vec3 rel = mod(p - uCam + uBox*.5, uBox) - uBox*.5;
          vec3 w = uCam + rel;
          vec4 mv = viewMatrix*vec4(w,1.);
          float d = -mv.z;
          vA = smoothstep(uBox.z*.5, uBox.z*.15, length(rel)) * (.25+.75*fract(aSeed*7.13)) * uAmt;
          vA *= .55 + .45*sin(uTime*(.6+aSeed*1.6)+aSeed*60.);
          gl_PointSize = (0.22 + aSeed*0.7) * uProj / max(d, 6.);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uTint; varying float vA;
        void main(){ vec2 c = gl_PointCoord-.5; float r = length(c); float a = smoothstep(.5,.0,r); a*=a; gl_FragColor = vec4(uTint, a*vA*.8); }`
    });
    this.dust = new THREE.Points(g, this.dustMat); this.dust.frustumCulled = false; this.dust.renderOrder = 5;
    this.scene.add(this.dust);
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth, h = this.canvas.clientHeight || window.innerHeight;
    this.w = w; this.h = h;
    this.renderer.setPixelRatio(this.quality.dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // على الشاشات الضيقة نوسّع الزاوية كي لا يُقصّ المشهد
    this.camera.userData.aspectK = w / h < 1 ? 1.0 + (1 - w / h) * 0.9 : 1;
    const land = w / h > 1.15;
    this.camera.setViewOffset(w, h, land ? -w * 0.09 : 0, land ? 0 : h * 0.1, w, h);
    this.camera.updateProjectionMatrix();
    this.dustMat.uniforms.uPx.value = this.quality.dpr * Math.min(1.4, Math.max(0.7, h / 800));
  }

  setFov(f) { const k = this.camera.userData.aspectK || 1; const v = f * k; if (Math.abs(this.camera.fov - v) > 1e-3) { this.camera.fov = v; this.camera.updateProjectionMatrix(); } }

  /* حاكم الجودة: ينزل بالدقة إن تدهور الأداء */
  _govern(dt) {
    this._ft.push(dt); if (this._ft.length < 90) return;
    const avg = this._ft.reduce((a, b) => a + b, 0) / this._ft.length; this._ft.length = 0;
    if (avg > 0.026 && this.quality.dpr > 1) { this.quality.dpr = Math.max(1, this.quality.dpr - 0.25); this.resize(); }
  }

  add(fn) { this.hooks.push(fn); }

  start() {
    if (this.running) return; this.running = true; this._last = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - this._last) / 1000); this._last = now;
      this.time += dt;
      PROJ.value = (this.h * this.quality.dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2));
      this.dustMat.uniforms.uTime.value = this.time;
      this.dustMat.uniforms.uCam.value.copy(this.camera.position);
      for (const h of this.hooks) h(dt, this.time);
      this.renderer.render(this.scene, this.camera);
      this._govern(dt);
    };
    requestAnimationFrame(loop);
  }
  stop() { this.running = false; }
}

/* مولّد نسيج 2D سريع */
export function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = opts.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = 8; t.wrapS = opts.wrapS || THREE.RepeatWrapping; t.wrapT = opts.wrapT || THREE.ClampToEdgeWrapping;
  return t;
}

export const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
