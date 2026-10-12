/*
  الصفحة الرئيسية: تشغيل رحلة البنّ (WebGL) وربطها بواجهة النصوص، ثم أقسام الصفحة (منتجات مختارة، لعبة الفنجان، نموذج الطلب).
*/
import { HYK, t, waLink, ICON } from './layout.js';
import { PRODUCTS, FEATURED } from './data.js';
import { Fortune } from './fortune.js';
import { BRAND } from './brand.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const lname = (o) => o[HYK.lang] || o.en;

/* ------------------------------------------------------------ منتجات مختارة */
function renderFeatured() {
  const g = $('#featGrid'); if (!g) return;
  g.innerHTML = FEATURED.map((id, i) => { const p = PRODUCTS.find(x => x.id === id); return `
    <article class="pcard reveal d${i + 1}">
      <div class="img"><img src="assets/products/${p.id}.webp" alt="${lname(p.name)}" width="500" height="600" loading="lazy"></div>
      <h3>${lname(p.name)}</h3><p>${lname(p.desc)}</p>
      <div class="packs meta">${p.packs.map(x => `<span class="chip num">${x}</span>`).join('')}</div>
      <div class="go"><a class="btn line" href="${waLink(t('p.pack.cta') + ' ' + lname(p.name))}" target="_blank" rel="noopener"><span>${t('p.ask')}</span></a></div>
    </article>`; }).join('');
  window.dispatchEvent(new Event('hyk-rerender'));
}

/* ------------------------------------------------------------ نموذج الطلب */
function renderContact() {
  const ci = $('#cinfo');
  if (ci) ci.innerHTML = `<li>${ICON.chat}<span><a href="${waLink(t('c.wa.hi'))}" target="_blank" rel="noopener">WhatsApp · +${BRAND.wa.replace(/(\d{2})(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')}</a></span></li><li>${ICON.clock}<span>${t('c.hours')}</span></li><li>${ICON.pin}<span>${t('c.addr')}</span></li>`;
  const sel = $('#fi'); if (sel) { const cur = sel.value; sel.innerHTML = `<option value="">${t('c.opt.any')}</option>` + PRODUCTS.map(p => `<option value="${p.id}">${lname(p.name)}</option>`).join(''); sel.value = cur; }
}
function bindForm() {
  const f = $('#quoteForm'); if (!f) return;
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    const prod = PRODUCTS.find(p => p.id === d.interest);
    const lines = [t('c.wa.hi')];
    if (d.name) lines.push(`${t('c.name')}: ${d.name}`);
    if (d.biz) lines.push(`${t('c.biz')}: ${d.biz}`);
    if (d.phone) lines.push(`${t('c.phone')}: ${d.phone}`);
    if (prod) lines.push(`${t('c.interest')}: ${lname(prod.name)}`);
    if (d.qty) lines.push(`${t('c.qty')}: ${d.qty}`);
    if (d.msg) lines.push(d.msg);
    window.open(waLink(lines.join('\n')), '_blank', 'noopener');
  });
}

/* ------------------------------------------------------------ رحلة البنّ */
function webglOK() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }

async function startJourney() {
  const section = $('#journey');
  if (!webglOK() || new URLSearchParams(location.search).has('nogl')) { section.classList.add('nogl'); return; }
  const [{ Story, CHAPTERS }, { Sfx }] = await Promise.all([import('./gl/story.js'), import('./gl/sfx.js')]);
  const sfx = new Sfx();
  const mobile = matchMedia('(max-width: 860px)').matches || matchMedia('(pointer: coarse)').matches;
  const chs = $$('.ch', section), hud = $('#hud'), cer = $('#cer'), dots = $('#dots'), shint = $('#shint');
  const names = ['j.c1.k', 'j.c2.k', 'j.c3.k', 'j.c4.k', 'j.c5.k', 'j.c6.k'];
  dots.innerHTML = names.map((k, i) => `<button type="button" role="tab" aria-label="${i + 1}" data-i="${i}"><span data-i18n="${k}"></span></button>`).join('');
  $$('span', dots).forEach(sp => { sp.textContent = t(sp.dataset.i18n); });
  if (mobile) section.style.height = '640vh';

  let story = null; let crackShown = 0;
  const ui = {
    onChapter(i) {
      chs.forEach((el, k) => el.classList.toggle('on', k === i));
      $$('button', dots).forEach((b, k) => b.classList.toggle('on', k === i));
      cer.classList.toggle('on', i === 5);
    },
    onRoast(temp, st, r, show) {
      hud.classList.toggle('on', show);
      if (!show) return;
      $('#tempv').textContent = Math.round(temp);
      $('#barv').style.left = (r * 100).toFixed(1) + '%';
      $('#stname').textContent = t('j.s' + st);
      const ck = $('#crack'); const first = temp > 195.5 && temp < 206, second = temp > 223;
      ck.classList.toggle('on', first || second); ck.textContent = second ? t('j.crack2') : t('j.crack');
    },
    onProgress(p) { shint.style.opacity = p > 0.012 ? 0 : 1; },
    onCups(n, started) {
      const q = $('#cq'), idx = Math.min(n + 1, 4);
      $('#cupno').textContent = started ? `${t('j.cup')} ${n + 1}` : '';
      q.textContent = t('j.q' + idx); q.dataset.k = 'j.q' + idx; q.classList.remove('swap'); void q.offsetWidth; q.classList.add('swap');
      $('#chint').classList.toggle('hot', n >= 2);
    },
    onMeter(m) { $('#meter').style.width = (m * 100).toFixed(0) + '%'; },
    onDone(d) { cer.classList.toggle('done', !!d); }
  };
  story = new Story({ canvas: $('#gl'), section, ui, sfx, mobile });
  window.__story = story;

  // الصوت
  const sbtn = $('#sndBtn');
  if (sbtn) sbtn.addEventListener('click', () => { const on = sfx.toggle(); sbtn.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  // نقاط الفصول والتخطّي
  dots.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; scrollTo({ top: story.chapterY(+b.dataset.i), behavior: 'smooth' }); });
  $('#skipj').addEventListener('click', () => { story.finishCeremony(true); scrollTo({ top: story.secTop + story.secH, behavior: 'smooth' }); });
  // iOS يطلب إذناً صريحاً لحسّاس الحركة (لمسة واحدة على لوحة الطقس تكفي)
  $('#cer').addEventListener('pointerdown', () => { try { if (typeof DeviceMotionEvent !== 'undefined' && DeviceMotionEvent.requestPermission) DeviceMotionEvent.requestPermission().catch(() => {}); } catch (e) {} }, { once: true });
  $('#shakeBtn').addEventListener('click', () => story.manualShake());
  $('#skipC').addEventListener('click', () => { story.finishCeremony(true); });
  $('#goOn').addEventListener('click', () => scrollTo({ top: story.secTop + story.secH + 4, behavior: 'smooth' }));
  // توقيف الرسم خارج الشاشة
  const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) story.start(); else story.stop(); }), { threshold: 0 });
  io.observe(section);
  story.start();
  addEventListener('load', () => story._measure());
  window.addEventListener('langchange', () => { const q = $('#cq'); if (q && q.dataset.k) q.textContent = t(q.dataset.k); });
  // أول ظهور: ترتيب الفصل الأول
  ui.onChapter(0);
}

/* ------------------------------------------------------------ لعبة الفنجان (معاينة) */
function teaser() {
  const cv = $('#ftCv'); if (!cv) return;
  const f = new Fortune(cv); f.start();
  const io = new IntersectionObserver((es) => es.forEach(e => e.isIntersecting ? f.start() : f.stop()));
  io.observe(cv);
}

function renderAll() { renderFeatured(); renderContact(); }
window.addEventListener('langchange', renderAll);
renderAll(); bindForm(); teaser();
startJourney();
