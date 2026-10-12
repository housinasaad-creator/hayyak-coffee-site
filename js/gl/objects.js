/*
  مجسّمات إجرائية: حبّة هال، حبّة بنّ تتحمّص (شيدر)، غبار الطحن، الدلّة النحاسية، الفنجان، المجمر، الجمر، البخار، خيط القهوة.
  الوحدة 1 = 1 سم. كل شيء مولّد بالكود؛ لا ملفات نماذج.
*/
import * as THREE from 'three';
import { canvasTex, smooth, lerp, clamp, PROJ } from './core.js';

/* ---------------------------------------------------------------- أدوات */
const GLSL_NOISE = `
float hash13(vec3 p){ p = fract(p*.1031); p += dot(p, p.zyx+31.32); return fract((p.x+p.y)*p.z); }
float vnoise(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  float a = hash13(i), b = hash13(i+vec3(1,0,0)), c = hash13(i+vec3(0,1,0)), d = hash13(i+vec3(1,1,0));
  float e = hash13(i+vec3(0,0,1)), g = hash13(i+vec3(1,0,1)), h = hash13(i+vec3(0,1,1)), k = hash13(i+vec3(1,1,1));
  return mix(mix(mix(a,b,f.x), mix(c,d,f.x), f.y), mix(mix(e,g,f.x), mix(h,k,f.x), f.y), f.z);
}`;

/* أنبوب بنصف قطر متغيّر على منحنى */
export function taperedTube(curve, radiusFn, segs = 64, radial = 20) {
  const frames = curve.computeFrenetFrames(segs, false);
  const pos = [], idx = [], uv = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, p = curve.getPointAt(t), N = frames.normals[i], B = frames.binormals[i], r = radiusFn(t);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      pos.push(p.x + r * (c * N.x + s * B.x), p.y + r * (c * N.y + s * B.y), p.z + r * (c * N.z + s * B.z));
      uv.push(j / radial, t);
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

function lathe(pts, seg = 96) { return new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg); }

const q4 = (v) => String(Math.round(v * 1e4) / 1e4 + 0);

/* يلحم نورماليات الدرزة في الأشكال الدورانية كي لا يظهر خط */
function weldSeam(geo) {
  const pos = geo.attributes.position, nor = geo.attributes.normal, map = new Map();
  for (let i = 0; i < pos.count; i++) {
    const k = q4(pos.getX(i)) + '|' + q4(pos.getY(i)) + '|' + q4(pos.getZ(i));
    (map.get(k) || map.set(k, []).get(k)).push(i);
  }
  for (const arr of map.values()) if (arr.length > 1) {
    let x = 0, y = 0, z = 0; for (const i of arr) { x += nor.getX(i); y += nor.getY(i); z += nor.getZ(i); }
    const l = Math.hypot(x, y, z) || 1; for (const i of arr) nor.setXYZ(i, x / l, y / l, z / l);
  }
  nor.needsUpdate = true; return geo;
}

export function softBlob(size, opacity = 0.55) {
  const tex = canvasTex(128, 128, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.45, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, depthWrite: false }));
  m.renderOrder = 2; return m;
}

export function glowSprite(color, size, opacity = 0.5) {
  const tex = canvasTex(128, 128, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.3, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.set(size, size, 1); s.renderOrder = 1; return s;
}

/* ---------------------------------------------------------------- حبّة هال (واقعية: ثلاثية الأضلاع، بيضوية، منقار قصير، عنق بني، ألياف طولية) */
let _podTex = null;
function podTextures() {
  if (_podTex) return _podTex;
  const R = (a, b) => a + Math.random() * (b - a);
  const map = canvasTex(1024, 512, (c, w, h) => {
    // u = حول الحبّة، v = على طولها (الأسفل: العنق، الأعلى: المنقار)
    const gr = c.createLinearGradient(0, h, 0, 0);
    gr.addColorStop(0, '#7d7c46'); gr.addColorStop(.06, '#8a9a52'); gr.addColorStop(.5, '#7f9a4a'); gr.addColorStop(.9, '#8ba55a'); gr.addColorStop(1, '#a3b46c');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 1500; i++) { // ألياف طولية دقيقة
      const x = R(0, w), l = R(h * .12, h * .8), y = R(0, h - l);
      c.strokeStyle = Math.random() < .55 ? `rgba(86,110,44,${R(.05, .22)})` : `rgba(206,206,130,${R(.05, .2)})`;
      c.lineWidth = R(.6, 1.8); c.beginPath(); c.moveTo(x, y); c.lineTo(x + R(-2, 2), y + l); c.stroke();
    }
    for (let k = 0; k < 3; k++) { // العروق الثلاثة البارزة
      const x = (k / 3) * w; c.fillStyle = 'rgba(96,120,50,.33)'; c.fillRect(x - 5, 0, 10, h);
      c.fillStyle = 'rgba(214,214,140,.16)'; c.fillRect(x + 4, 0, 3, h);
    }
    for (let i = 0; i < 380; i++) { c.fillStyle = `rgba(${R(80, 130)},${R(85, 120)},${R(40, 60)},${R(.04, .13)})`; c.beginPath(); c.arc(R(0, w), R(0, h), R(2, 9), 0, 6.3); c.fill(); }
    const stem = c.createLinearGradient(0, h, 0, h * .86); stem.addColorStop(0, 'rgba(92,60,30,.95)'); stem.addColorStop(1, 'rgba(92,60,30,0)'); c.fillStyle = stem; c.fillRect(0, h * .86, w, h * .14);
    const tip = c.createLinearGradient(0, 0, 0, h * .06); tip.addColorStop(0, 'rgba(140,110,60,.55)'); tip.addColorStop(1, 'rgba(140,110,60,0)'); c.fillStyle = tip; c.fillRect(0, 0, w, h * .06);
  });
  const bump = canvasTex(1024, 512, (c, w, h) => {
    c.fillStyle = '#808080'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const x = R(0, w), l = R(h * .1, h * .7), y = R(0, h - l); c.strokeStyle = Math.random() < .5 ? 'rgba(235,235,235,.35)' : 'rgba(30,30,30,.4)'; c.lineWidth = R(.7, 1.9); c.beginPath(); c.moveTo(x, y); c.lineTo(x + R(-1.5, 1.5), y + l); c.stroke(); }
    for (let k = 0; k < 3; k++) { const x = (k / 3) * w; c.fillStyle = 'rgba(240,240,240,.55)'; c.fillRect(x - 3, 0, 6, h); }
    for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(${Math.random() < .5 ? 220 : 40},${Math.random() < .5 ? 220 : 40},${Math.random() < .5 ? 220 : 40},.12)`; c.beginPath(); c.arc(R(0, w), R(0, h), R(3, 14), 0, 6.3); c.fill(); }
  }, { linear: true });
  return (_podTex = { map, bump });
}
export function makePod() {
  const len = 3.5, Rr = 0.95, U = 72, V = 110, pos = [], uv = [], idx = [];
  for (let j = 0; j <= V; j++) {
    const s = j / V, z = (s - 0.5) * len;
    // بيضوية: الكتلة أقرب للعنق، ثم تستدق إلى منقار قصير
    const body = Math.pow(Math.sin(Math.PI * Math.pow(Math.min(1, Math.max(0, s)), 0.82)), 0.62);
    const neck = s < 0.06 ? 0.32 + 0.68 * Math.pow(s / 0.06, 0.6) : 1;
    const prof = body * neck * (s > 0.93 ? Math.pow(Math.max(0.02, (1 - s) / 0.07), 0.55) : 1);
    const bend = Math.sin(Math.PI * s) * 0.2; // انحناء خفيف
    for (let i = 0; i <= U; i++) {
      const th = (i / U) * Math.PI * 2;
      const tri = 1 + 0.13 * Math.cos(3 * th) + 0.022 * Math.cos(9 * th);
      const rid = 1 + 0.012 * Math.cos(24 * th);
      const r = Rr * prof * tri * rid;
      pos.push(r * Math.cos(th) + bend, r * Math.sin(th), z); uv.push(i / U, s);
    }
  }
  for (let j = 0; j < V; j++) for (let i = 0; i < U; i++) { const a = j * (U + 1) + i, b = a + U + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals(); weldSeam(g);
  const { map, bump } = podTextures();
  const mat = new THREE.MeshPhysicalMaterial({ map, bumpMap: bump, bumpScale: 1.6, roughness: 0.66, metalness: 0, sheen: 0.4, sheenColor: new THREE.Color(0xb8d080), sheenRoughness: 0.6, envMapIntensity: 0.5 });
  const m = new THREE.Mesh(g, mat);
  m.rotation.y = Math.PI / 2;
  const grp = new THREE.Group(); grp.add(m);
  return grp;
}

/* بذور الهال: صغيرة داكنة زاويّة التجاعيد */
export function makeSeeds(n = 8) {
  const grp = new THREE.Group();
  const bump = canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#808080'; c.fillRect(0, 0, w, h); for (let i = 0; i < 500; i++) { c.fillStyle = Math.random() < .5 ? 'rgba(235,235,235,.5)' : 'rgba(25,25,25,.5)'; c.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 6, 1 + Math.random() * 2); } }, { linear: true });
  const mat = new THREE.MeshStandardMaterial({ color: 0x2c1b10, roughness: 0.78, bumpMap: bump, bumpScale: 2.2 });
  for (let i = 0; i < n; i++) {
    const geo = new THREE.IcosahedronGeometry(0.2, 2), p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k), z = p.getZ(k), f = 1 + 0.22 * Math.sin(x * 21 + i) * Math.cos(y * 19) + 0.15 * Math.sin(z * 25 + i * 2); p.setXYZ(k, x * f * 1.15, y * f * 0.9, z * f); }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat); m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6); grp.add(m);
  }
  return grp;
}

/* ---------------------------------------------------------------- حبّة البنّ (تتحمّص) */
export function beanGeometry() {
  const geo = new THREE.SphereGeometry(1, 144, 112);
  const p = geo.attributes.position, a = 1.0, b = 0.66, c = 0.43, seamMap = new Map();
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const key = q4(x) + '|' + q4(y) + '|' + q4(z);
    if (seamMap.has(key)) { const v = seamMap.get(key); p.setXYZ(i, v[0], v[1], v[2]); continue; }
    x *= a; y *= b; z *= c;
    if (z > 0) {
      const yc = 0.15 * Math.sin(x * 2.4 + 0.3), d = Math.abs(y - yc);
      const edge = Math.pow(Math.max(0, 1 - x * x), 0.55);
      const groove = 0.2 * c * Math.exp(-Math.pow(d / 0.06, 2)) * edge;
      z = z - groove * Math.min(1, z / (0.25 * c) + 0.2);
    }
    p.setXYZ(i, x, y, z); seamMap.set(key, [x, y, z]);
  }
  geo.computeVertexNormals(); weldSeam(geo);
  return geo;
}

export function makeBean() {
  const geo = beanGeometry();
  const uRoast = { value: 0 }, uTime = { value: 0 }, uCrack = { value: 0 };
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.7, metalness: 0, clearcoat: 0.0, clearcoatRoughness: 0.35, envMapIntensity: 1.5 });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uRoast = uRoast; sh.uniforms.uTime = uTime; sh.uniforms.uCrack = uCrack;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\nuniform float uRoast, uCrack; varying vec3 vObj; varying float vGroove;\n${GLSL_NOISE}`)
      .replace('#include <begin_vertex>', `
        vec3 transformed = position; vObj = position;
        float yc = .15*sin(position.x*2.4+.3); float gd = abs(position.y-yc);
        vGroove = position.z > 0. ? exp(-pow(gd/.075,2.)) : 0.;
        float wr = vnoise(position*6.) * .028 + vnoise(position*17.)*.01;
        transformed += normal * wr * smoothstep(.1,.9,uRoast);
        transformed *= 1. + .16*smoothstep(.2,.6,uRoast) + uCrack*.05;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform float uRoast, uTime; varying vec3 vObj; varying float vGroove;\n${GLSL_NOISE}
        vec3 roastRamp(float r){
          vec3 c0=vec3(.50,.57,.33), c1=vec3(.80,.70,.36), c2=vec3(.66,.42,.19), c3=vec3(.38,.2,.09), c4=vec3(.19,.095,.045), c5=vec3(.09,.04,.025);
          vec3 c = mix(c0,c1,smoothstep(0.,.22,r)); c = mix(c,c2,smoothstep(.22,.42,r)); c = mix(c,c3,smoothstep(.42,.65,r)); c = mix(c,c4,smoothstep(.65,.85,r)); c = mix(c,c5,smoothstep(.85,1.,r));
          return c;
        }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float n1 = vnoise(vObj*16.), n2 = vnoise(vObj*46.);
        vec3 rc = roastRamp(uRoast) * (.9 + .2*n1) * (.95+.1*n2);
        rc = mix(rc, rc*.45, vGroove*.85);
        vec3 silver = vec3(.78,.72,.55) * (.8+.2*n2);
        rc = mix(rc, silver, vGroove * (1.-smoothstep(.0,.35,uRoast)) * .55);
        diffuseColor.rgb = pow(rc, vec3(2.2));`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(.78, .42, smoothstep(.5,1.,uRoast)) + (n1-.5)*.1;`);
  };
  const m = new THREE.Mesh(geo, mat);
  return { mesh: m, geo, setRoast(r) { uRoast.value = r; }, setTime(t) { uTime.value = t; }, setCrack(v) { uCrack.value = v; } };
}


/* حقل حبوب بنّ محمّصة (مثبّتة حول الفنجان): InstancedMesh واحد */
export function makeBeanField(n) {
  const geo = beanGeometry();
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.38, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.32, envMapIntensity: 1.4 });
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  const col = new THREE.Color();
  for (let i = 0; i < n; i++) { const k = 0.7 + Math.random() * 0.75; col.setRGB(0.05 * k, 0.022 * k, 0.009 * k); mesh.setColorAt(i, col); }
  mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  return mesh;
}

/* ---------------------------------------------------------------- غبار الطحن (يسري من الحبّة إلى الدلّة) */
export function makePowder(count, beanPos, beanScale, potMouth) {
  const g = new THREE.BufferGeometry(), a0 = new Float32Array(count * 3), seed = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // عيّنة على سطح الإهليلج (حبة البنّ)
    let u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    a0[i * 3] = 1.0 * s * Math.cos(th); a0[i * 3 + 1] = 0.7 * u; a0[i * 3 + 2] = 0.5 * s * Math.sin(th);
    seed[i * 3] = Math.random(); seed[i * 3 + 1] = Math.random(); seed[i * 3 + 2] = Math.random();
  }
  g.setAttribute('position', new THREE.BufferAttribute(a0, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));
  const ctrl = new THREE.Vector3().addVectors(beanPos, potMouth).multiplyScalar(0.5); ctrl.y += 46; ctrl.z += 8;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uProj: PROJ, uFlow: { value: 0 }, uTime: { value: 0 }, uShow: { value: 0 }, uPx: { value: 1 }, uBean: { value: beanPos.clone() }, uScale: { value: beanScale }, uCtrl: { value: ctrl }, uMouth: { value: potMouth.clone() } },
    vertexShader: `
      uniform float uFlow, uTime, uShow, uPx, uScale, uProj; uniform vec3 uBean, uCtrl, uMouth; attribute vec3 aSeed; varying float vA; varying float vH;
      vec3 bez(vec3 a, vec3 b, vec3 c, float t){ float u=1.-t; return u*u*a + 2.*u*t*b + t*t*c; }
      void main(){
        float f = clamp(uFlow*1.55 - aSeed.x*.55, 0., 1.);
        vec3 P0 = uBean + position*uScale;
        vec3 C = bez(uBean, uCtrl, uMouth, f);
        vec3 T = normalize(bez(uBean, uCtrl, uMouth, min(1.,f+.02)) - bez(uBean, uCtrl, uMouth, max(0.,f-.02)) + vec3(1e-4));
        vec3 N1 = normalize(cross(T, vec3(0.,1.,.15))), N2 = cross(T, N1);
        float ang = aSeed.y*6.2832 + uTime*(1.2+aSeed.z*1.6) + f*9.;
        float rad = (3. + aSeed.z*9.) * sin(3.14159*f) * (.6+.6*aSeed.y);
        vec3 P1 = C + (N1*cos(ang) + N2*sin(ang))*rad;
        vec3 w = mix(P0, P1, smoothstep(0.,.06,f));
        w += vec3(sin(uTime*2.+aSeed.x*30.), cos(uTime*1.7+aSeed.y*30.), sin(uTime*1.3+aSeed.z*30.))*.05*(1.-smoothstep(0.,.1,f));
        vec4 mv = viewMatrix*modelMatrix*vec4(w,1.);
        float vis = smoothstep(0.,.04,f) + (1.-smoothstep(0.,.04,f))*uShow;
        vA = uShow * (1.-smoothstep(.93,1.,f)) * (.6+.4*aSeed.z);
        vH = aSeed.z;
        gl_PointSize = (0.2 + aSeed.x*0.5) * uProj / max(-mv.z, 8.);
        gl_Position = projectionMatrix*mv;
      }`,
    fragmentShader: `
      varying float vA; varying float vH;
      void main(){ vec2 c = gl_PointCoord-.5; float r = length(c); float a = smoothstep(.5,.05,r);
        vec3 col = mix(vec3(.55,.30,.12), vec3(1.,.78,.4), vH);
        gl_FragColor = vec4(col, a*vA); }`
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = 6; return pts;
}

/* ---------------------------------------------------------------- الدلّة */
export function makePot() {
  const grp = new THREE.Group();
  const engraved = canvasTex(1024, 256, (c, w, h) => {
    c.fillStyle = '#808080'; c.fillRect(0, 0, w, h);
    // شرائط نقش هندسية أفقية
    const band = (y0, y1, kind) => {
      for (let x = 0; x < w; x += 16) {
        c.fillStyle = '#d0d0d0'; c.beginPath();
        if (kind === 0) { c.moveTo(x, y1); c.lineTo(x + 8, y0); c.lineTo(x + 16, y1); c.closePath(); }
        else if (kind === 1) { c.moveTo(x + 8, y0); c.lineTo(x + 16, (y0 + y1) / 2); c.lineTo(x + 8, y1); c.lineTo(x, (y0 + y1) / 2); c.closePath(); }
        else { c.arc(x + 8, (y0 + y1) / 2, (y1 - y0) / 2.6, 0, 6.3); }
        c.fill();
      }
    };
    band(40, 70, 0); band(96, 126, 1); band(150, 178, 2); band(205, 232, 0);
    c.fillStyle = '#e8e8e8'; for (const y of [30, 82, 140, 192, 240]) c.fillRect(0, y, w, 3);
  }, { linear: true });
  engraved.repeat.set(2, 1);
  const brass = new THREE.MeshPhysicalMaterial({ color: 0xc99a46, metalness: 1, roughness: 0.27, envMapIntensity: 1.5, bumpMap: engraved, bumpScale: 0.9, clearcoat: 0.25, clearcoatRoughness: 0.25 });
  const brassPlain = brass.clone(); brassPlain.bumpMap = null;
  const dark = new THREE.MeshPhysicalMaterial({ color: 0x1b0f08, roughness: 0.45, metalness: 0, clearcoat: 0.4 });

  const body = lathe([[0.01, 0.02], [8.4, 0.02], [9.1, 0.5], [9.7, 1.7], [10.5, 3.8], [11.0, 6.4], [10.6, 9.0], [9.5, 11.8], [8.2, 14.8], [7.0, 17.8], [6.1, 20.6], [5.6, 22.6], [5.9, 23.5], [5.7, 24.2], [5.0, 24.2]], 112);
  const bodyM = new THREE.Mesh(weldSeam(body), brass); grp.add(bodyM);
  for (const [r, y, tr] of [[9.85, 2.2, 0.38], [10.98, 6.9, 0.45], [8.3, 14.4, 0.4], [5.75, 21.8, 0.4]]) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(r, tr, 14, 96).rotateX(Math.PI / 2), brassPlain); t.position.y = y; grp.add(t);
  }
  // سطح القهوة داخل الدلّة (يُرى عند فتح الغطاء)
  const inner = new THREE.Mesh(new THREE.CircleGeometry(5.0, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x120804, roughness: 0.25, emissive: 0x4a1a06, emissiveIntensity: 0.25 }));
  inner.position.y = 21.3; grp.add(inner);

  // الصبّة
  const spoutCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(8.4, 5.5, 0), new THREE.Vector3(12.6, 9.2, 0), new THREE.Vector3(15.4, 14.8, 0), new THREE.Vector3(17.4, 20.8, 0), new THREE.Vector3(19.6, 26.2, 0)]);
  const spout = new THREE.Mesh(taperedTube(spoutCurve, t => lerp(2.2, 0.95, t) * (t > 0.93 ? 1 + (t - 0.93) * 4.2 : 1), 80, 24), brassPlain); grp.add(spout);
  const tipP = spoutCurve.getPointAt(1);
  const lipRing = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.2, 10, 28), brassPlain); lipRing.position.copy(tipP); lipRing.lookAt(spoutCurve.getTangentAt(1).add(tipP)); grp.add(lipRing);

  // اليد
  const hCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-5.9, 22.0, 0), new THREE.Vector3(-11.4, 20.4, 0), new THREE.Vector3(-15.6, 14.8, 0), new THREE.Vector3(-14.2, 8.6, 0), new THREE.Vector3(-10.2, 5.6, 0)]);
  grp.add(new THREE.Mesh(taperedTube(hCurve, () => 0.8, 60, 16), brassPlain));
  const grip = new THREE.CatmullRomCurve3([hCurve.getPointAt(0.32), hCurve.getPointAt(0.42), hCurve.getPointAt(0.5), hCurve.getPointAt(0.58), hCurve.getPointAt(0.68)]);
  grp.add(new THREE.Mesh(taperedTube(grip, t => 1.15 + Math.sin(t * Math.PI) * 0.25, 30, 16), dark));

  // الغطاء بمفصّلة عند جهة اليد
  const lidPivot = new THREE.Group(); lidPivot.position.set(-5.4, 24.2, 0); grp.add(lidPivot);
  const lid = new THREE.Group(); lid.position.set(5.4, 0, 0); lidPivot.add(lid);
  lid.add(new THREE.Mesh(weldSeam(lathe([[0.01, 0.02], [5.3, 0.0], [5.45, 0.5], [5.0, 0.9], [4.4, 1.5], [3.4, 2.4], [2.2, 3.3], [1.0, 3.9], [0.01, 4.1]], 96)), brass));
  const fin = new THREE.Mesh(new THREE.SphereGeometry(1.15, 24, 18), brassPlain); fin.position.y = 4.9; lid.add(fin);
  const finBase = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.9, 0.9, 20), brassPlain); finBase.position.y = 4.1; lid.add(finBase);

  return { group: grp, lidPivot, tipLocal: tipP.clone().add(new THREE.Vector3(0, 0.2, 0)), mouthY: 24.2, inner, handleLocal: new THREE.Vector3(-14.5, 12, 0), mats: { brass } };
}

/* ---------------------------------------------------------------- الفنجان */
const FJ_OUT = [[0.01, 0], [1.5, 0], [1.68, 0.16], [1.82, 0.6], [2.16, 1.1], [2.7, 1.95], [3.0, 2.95], [3.18, 3.95], [3.26, 4.8]];
const FJ_IN = [[3.14, 4.82], [3.02, 4.0], [2.8, 3.0], [2.36, 2.05], [1.7, 1.45], [0.01, 1.3]];
export const FINJAN_H = 4.84, FINJAN_FLOOR = 1.3;
export function finjanInnerR(y) {
  const pts = FJ_IN.slice().reverse(); // من الأسفل للأعلى
  for (let i = 0; i < pts.length - 1; i++) if (y >= pts[i][1] && y <= pts[i + 1][1]) { const t = (y - pts[i][1]) / (pts[i + 1][1] - pts[i][1]); return lerp(pts[i][0], pts[i + 1][0], t); }
  return y < pts[0][1] ? 0.01 : pts[pts.length - 1][0];
}
export function makeFinjan(drawEmblem) {
  const grp = new THREE.Group();
  const vOfY = (y) => { // موضع y على ملف الدوران الخارجي كنسبة فهرس
    for (let i = 0; i < FJ_OUT.length - 1; i++) if (y >= FJ_OUT[i][1] && y <= FJ_OUT[i + 1][1]) return (i + (y - FJ_OUT[i][1]) / (FJ_OUT[i + 1][1] - FJ_OUT[i][1])) / (FJ_OUT.length - 1);
    return y < 0 ? 0 : 1;
  };
  const tex = canvasTex(1024, 512, (c, w, h) => {
    c.fillStyle = '#f6f1e7'; c.fillRect(0, 0, w, h);
    const yy = (y) => (1 - vOfY(y)) * h; // v=1 أعلى الصورة في CanvasTexture(flipY)
    c.fillStyle = '#c99a46';
    for (const [y, th] of [[4.62, 3.5], [4.42, 1.6], [0.5, 2], [0.32, 1.2]]) c.fillRect(0, yy(y) - th / 2, w, th);
    if (drawEmblem) drawEmblem(c, w * 0.5, yy(2.65), h * 0.19);
  });
  const mat = new THREE.MeshPhysicalMaterial({ map: tex, color: 0xffffff, roughness: 0.18, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.1 });
  const outer = weldSeam(lathe(FJ_OUT, 96)); outer.rotateY(Math.PI);
  grp.add(new THREE.Mesh(outer, mat));
  const innerM = new THREE.MeshPhysicalMaterial({ color: 0xf2ece0, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide });
  grp.add(new THREE.Mesh(weldSeam(lathe(FJ_IN, 96)), innerM));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.075, 8, 96).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xd1a54f, metalness: 1, roughness: 0.25 })); rim.position.y = 4.84; grp.add(rim);

  // سائل القهوة
  const uTime = { value: 0 }, uAmp = { value: 0 }, uSlosh = { value: new THREE.Vector2() }, uFoam = { value: 0 }, uImpact = { value: 0 };
  const liqMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6 });
  liqMat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uTime; sh.uniforms.uAmp = uAmp; sh.uniforms.uSlosh = uSlosh; sh.uniforms.uFoam = uFoam; sh.uniforms.uImpact = uImpact;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvP = position.xz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform float uTime, uAmp, uFoam, uImpact; uniform vec2 uSlosh; varying vec2 vP;
      ${GLSL_NOISE}
      float gFoam = 0.; float gBub = 0.;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float rr = length(vP);
        float ang = uTime*.1 + uSlosh.x*.6;
        vec2 q = mat2(cos(ang),-sin(ang),sin(ang),cos(ang)) * vP;
        vec3 wv = vec3(q*2.3, uTime*.06);
        float n1 = vnoise(wv), n2 = vnoise(wv*2.7+4.1), n3 = vnoise(wv*6.3+9.);
        float warp = n1*.55 + n2*.3 + n3*.15;
        float edge = smoothstep(.52, 1., rr);
        gFoam = smoothstep(.34, .72, warp*.95 + edge*.6 - (1.-uFoam)*.55) * uFoam;
        vec2 gq = q*13.; vec2 gi = floor(gq), gf = fract(gq)-.5;
        float h = hash13(vec3(gi,3.));
        vec2 jit = (vec2(hash13(vec3(gi,9.)), hash13(vec3(gi,5.))) - .5) * .45;
        float rad = .1 + .24*hash13(vec3(gi,7.));
        gBub = smoothstep(rad, rad-.05, length(gf-jit)) * step(.5,h) * gFoam;
        vec3 dark = vec3(.09,.04,.018), crema = vec3(.55,.31,.14), lite = vec3(.86,.62,.36);
        vec3 c = mix(dark, crema, gFoam);
        c = mix(c, lite, gBub*.75);
        c += vec3(.42,.26,.12) * smoothstep(.9,1.,rr) * .35 * uFoam;
        diffuseColor.rgb = pow(c, vec3(2.2));`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(.05, .62, gFoam) - gBub*.3;`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        vec2 dv = vP / max(rr, .001);
        float w1 = sin(rr*15. - uTime*5.5)*.5 + sin(rr*24. - uTime*8. + 1.3)*.3;
        float ring = sin(rr*30. - uTime*9.5) * exp(-rr*2.4) * uImpact;
        vec3 pert = vec3(dv.x, 0., dv.y) * (w1*(.05 + uAmp*.4) + ring*.32);
        pert.xz += uSlosh * .6 + (vec2(n3, n2) - .5) * .28 * gFoam;
        normal = normalize(normal + (viewMatrix * vec4(pert, 0.)).xyz);`);
  };
  const liq = new THREE.Mesh(new THREE.CircleGeometry(1, 64).rotateX(-Math.PI / 2), liqMat); liq.visible = false; grp.add(liq);
  const lipRingMat = new THREE.MeshBasicMaterial({ color: 0xb98a4c, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
  const crema = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 64).rotateX(-Math.PI / 2), lipRingMat); crema.position.y = 0.004; liq.add(crema);

  const api = {
    group: grp, liquid: liq, level: 0, tilt: new THREE.Vector2(),
    setLevel(L) { // L نسبة من عمق الداخل (0..1)
      this.level = L;
      if (L <= 0.003) { liq.visible = false; return; }
      liq.visible = true;
      const y = lerp(FINJAN_FLOOR, 4.6, L); liq.position.y = y; const r = finjanInnerR(y) * 0.985; liq.scale.set(r, 1, r);
    },
    update(dt, t, slosh, amp, foam = 0, impact = 0) { uTime.value = t; uAmp.value = amp; uSlosh.value.copy(slosh); uFoam.value = foam; uImpact.value = impact; }
  };
  return api;
}

/* ---------------------------------------------------------------- المجمر (الجمر تحت الدلّة) */
export function makeBrazier() {
  const grp = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({ color: 0x2a1c12, metalness: 0.9, roughness: 0.42, envMapIntensity: 0.9 });
  const bowl = new THREE.Mesh(weldSeam(lathe([[0.01, 0.0], [7.5, 0.0], [8.8, 0.4], [10.6, 2.4], [11.8, 4.8], [12.3, 6.0], [12.0, 6.3], [11.0, 5.4], [9.6, 3.2], [7.0, 1.6], [0.01, 1.4]], 96)), mat);
  grp.add(bowl);
  for (let i = 0; i < 3; i++) { // قوائم
    const a = i / 3 * Math.PI * 2 + 0.5, leg = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.5, 2.5, 10), mat); leg.position.set(Math.cos(a) * 7, -0.9, Math.sin(a) * 7); grp.add(leg);
  }
  const coalMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uHeat: { value: 1 } },
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `${GLSL_NOISE} uniform float uTime, uHeat; varying vec2 vP;
      void main(){
        float r = length(vP)/10.5;
        float n = vnoise(vec3(vP*.55, uTime*.15)) * .6 + vnoise(vec3(vP*1.4, uTime*.45))*.4;
        float glow = smoothstep(.3,.8,n);
        float pulse = .75+.25*sin(uTime*1.7 + n*9.);
        vec3 c = mix(vec3(.07,.035,.02), vec3(1.,.38,.06), glow*pulse*uHeat);
        c += vec3(1.,.7,.2) * smoothstep(.72,.95,n) * pulse*uHeat*.8;
        gl_FragColor = vec4(c*(1.-r*r*.5), 1.);
      }`
  });
  const coals = new THREE.Mesh(new THREE.CircleGeometry(10.6, 48).rotateX(-Math.PI / 2), coalMat); coals.position.y = 4.1; grp.add(coals);
  // مشبك تثبيت
  for (let i = 0; i < 3; i++) { const bar = new THREE.Mesh(new THREE.BoxGeometry(24, 0.5, 0.6), mat); bar.position.y = 6.0; bar.rotation.y = i * Math.PI / 3; grp.add(bar); }
  const light = new THREE.PointLight(0xff7a22, 60, 26, 1.8); light.position.y = 4.8; grp.add(light);
  return { group: grp, coalMat, light };
}

/* ---------------------------------------------------------------- جسيمات: جمر + بخار */
export function makeEmbers(count = 90) {
  const g = new THREE.BufferGeometry(), s = new Float32Array(count * 3), p = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) { s[i * 3] = Math.random(); s[i * 3 + 1] = Math.random(); s[i * 3 + 2] = Math.random(); }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(s, 3));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uProj: PROJ, uTime: { value: 0 }, uAmt: { value: 1 }, uPx: { value: 1 } },
    vertexShader: `uniform float uTime, uAmt, uPx, uProj; attribute vec3 aSeed; varying float vA;
      void main(){ float t = fract(uTime*(.12+aSeed.x*.14)+aSeed.y);
        vec3 w = vec3((aSeed.x-.5)*16. + sin(uTime*1.3+aSeed.z*20.)*3.*t, 5. + t*(26.+aSeed.z*20.), (aSeed.z-.5)*16. + cos(uTime*1.1+aSeed.x*20.)*3.*t);
        vec4 mv = modelViewMatrix*vec4(w,1.); vA = uAmt * smoothstep(0.,.08,t)*(1.-t)*(.4+.6*fract(aSeed.y*9.+uTime*.8));
        gl_PointSize = (0.28+aSeed.z*0.6)*uProj/max(-mv.z,8.); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `varying float vA; void main(){ float r = length(gl_PointCoord-.5); float a = smoothstep(.5,.0,r); gl_FragColor = vec4(1.,.55,.18, a*a*vA); }`
  });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 7; return pts;
}

export function makeSteam(count = 60, rise = 24, width = 2.2, size = 9) {
  const g = new THREE.BufferGeometry(), s = new Float32Array(count * 3), p = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) { s[i * 3] = Math.random(); s[i * 3 + 1] = Math.random(); s[i * 3 + 2] = Math.random(); }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(s, 3));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uProj: PROJ, uTime: { value: 0 }, uAmt: { value: 0 }, uPx: { value: 1 }, uRise: { value: rise }, uWidth: { value: width }, uSize: { value: size }, uTint: { value: new THREE.Color(1, .94, .86) } },
    vertexShader: `uniform float uTime, uAmt, uPx, uRise, uWidth, uSize, uProj; attribute vec3 aSeed; varying float vA; varying float vR;
      void main(){ float t = fract(uTime*(.07+aSeed.x*.05)+aSeed.y);
        float sw = sin(uTime*.9 + aSeed.z*30. + t*5.)*uWidth*t;
        vec3 w = vec3((aSeed.x-.5)*uWidth*(.4+t) + sw, t*uRise, (aSeed.z-.5)*uWidth*(.4+t) + cos(uTime*.8+aSeed.x*30.+t*4.)*uWidth*t*.8);
        vec4 mv = modelViewMatrix*vec4(w,1.); vA = uAmt * smoothstep(0.,.18,t) * pow(1.-t, 1.4) * .34; vR = aSeed.y;
        gl_PointSize = uSize*(.5+t*1.8+aSeed.z*.5)*uProj/max(-mv.z,8.); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uTint; varying float vA; varying float vR; void main(){ vec2 c = gl_PointCoord-.5; float r = length(c); float a = smoothstep(.5,.0,r); a = a*a*(.75+.25*sin(vR*40.+c.x*9.)); gl_FragColor = vec4(uTint, a*vA); }`
  });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 8; return pts;
}

/* ---------------------------------------------------------------- خيط القهوة من الصبّة إلى الفنجان */
export function makeStream() {
  const geo = new THREE.CylinderGeometry(1, 1, 1, 12, 56, true);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uP0: { value: new THREE.Vector3() }, uP1: { value: new THREE.Vector3() }, uP2: { value: new THREE.Vector3() }, uR: { value: 0.42 }, uHead: { value: 0 }, uTail: { value: 0 }, uTime: { value: 0 } },
    vertexShader: `${GLSL_NOISE} uniform vec3 uP0,uP1,uP2; uniform float uR,uHead,uTail,uTime; varying float vT; varying float vAng; varying float vVis; varying vec3 vWN;
      void main(){
        float t = position.y + .5; vT = t;
        float tt = mix(uTail, uHead, t);
        float u = 1.-tt; vec3 c = u*u*uP0 + 2.*u*tt*uP1 + tt*tt*uP2;
        vec3 tan = normalize(2.*u*(uP1-uP0) + 2.*tt*(uP2-uP1));
        vec3 s = normalize(cross(tan, vec3(0.,0.,1.))); vec3 f = cross(tan, s);
        float ang = atan(position.z, position.x); vAng = ang;
        float r = uR * (1. + .25*sin(tt*28. - uTime*18.) * tt) * (.55 + .45*smoothstep(0.,.1,tt)) * (1. - .3*tt);
        r *= step(uTail+.001, uHead);
        vec3 off = (s*cos(ang) + f*sin(ang)) * r;
        vWN = normalize(mat3(modelMatrix)*(s*cos(ang) + f*sin(ang)));
        vVis = 1.;
        vec4 w = modelMatrix*vec4(c+off,1.);
        gl_Position = projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader: `varying float vT; varying float vAng; varying vec3 vWN; uniform float uTime;
      void main(){
        vec3 base = vec3(.26,.12,.045);
        float fres = pow(1.-abs(vWN.z)*.7, 2.);
        float streak = .5+.5*sin(vAng*3. + vT*40. - uTime*16.);
        vec3 col = base + vec3(.55,.34,.16)*fres*.7 + vec3(.5,.3,.12)*streak*.08;
        col += vec3(1.,.85,.6) * pow(max(0.,dot(normalize(vWN), normalize(vec3(-.4,.7,.6)))), 40.) * .8;
        gl_FragColor = vec4(col, .93);
      }`
  });
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = 4; m.visible = false; return m;
}

/* ---------------------------------------------------------------- أرضية حجرية خضراء رمادية (من هوية الحساب المرجعي) */
export function makeStoneFloor(radius = 90) {
  const tex = canvasTex(1024, 1024, (c, w, h) => {
    c.fillStyle = '#2e3a33'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { const x = Math.random() * w, y = Math.random() * h, r = Math.random() * 3 + .5; c.fillStyle = `rgba(${Math.random() < .5 ? '20,28,24' : '70,86,74'},${Math.random() * .18})`; c.beginPath(); c.arc(x, y, r, 0, 6.3); c.fill(); }
    for (let i = 0; i < 40; i++) { c.strokeStyle = `rgba(15,20,17,${Math.random() * .25})`; c.lineWidth = Math.random() * 2; c.beginPath(); let x = Math.random() * w, y = Math.random() * h; c.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (Math.random() - .5) * 120; y += (Math.random() - .5) * 120; c.lineTo(x, y); } c.stroke(); }
  }, { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping });
  tex.repeat.set(3, 3);
  const fade = canvasTex(256, 256, (c, w, h) => { const gr = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, '#fff'); gr.addColorStop(.55, '#aaa'); gr.addColorStop(1, '#000'); c.fillStyle = gr; c.fillRect(0, 0, w, h); }, { linear: true, wrapS: THREE.ClampToEdgeWrapping });
  const m = new THREE.Mesh(new THREE.CircleGeometry(radius, 64).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tex, alphaMap: fade, transparent: true, roughness: 0.62, metalness: 0.08, envMapIntensity: 0.7 }));
  return m;
}

export function makeTray(r = 8.4) {
  const mat = new THREE.MeshPhysicalMaterial({ color: 0x4b3d26, metalness: 0.7, roughness: 0.58, envMapIntensity: 0.4 });
  const pts = [[0.01, 0.0], [r - 1, 0.0], [r - 0.4, 0.2], [r, 0.7], [r + 0.05, 0.9], [r - 0.3, 0.95], [r - 0.5, 0.5], [r - 1.6, 0.35], [0.01, 0.35]];
  return new THREE.Mesh(weldSeam(lathe(pts, 96)), mat);
}
