/*
  الهيكل المشترك: الترويسة والتذييل، تبديل اللغة (AR/TR/EN)، الظهور عند التمرير، زر واتساب العائم.
  كل صفحة تحمّل هذا الملف ثم ملفها الخاص. الأحداث: window 'langchange' بعد كل تبديل لغة.
*/
import { BRAND, markSVG } from './brand.js';
import { T, LANGS, detectLang } from './i18n.js';

const ICON = {
  wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21s-7-6.2-7-11.2A7 7 0 0 1 19 9.8C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.4"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M6 13l6 6 6-6"/></svg>'
};

const PAGE = document.body.dataset.page || 'home';
const TITLES = {
  home: { ar: 'حيّاك | قهوة عربية وسورية بالجملة', tr: 'Hayyak | Toptan Arap ve Suriye kahvesi', en: 'Hayyak | Wholesale Arabic & Syrian coffee' },
  products: { ar: 'منتجاتنا | حيّاك', tr: 'Ürünlerimiz | Hayyak', en: 'Products | Hayyak' },
  coffee: { ar: 'عالم القهوة | حيّاك', tr: 'Kahve Dünyası | Hayyak', en: 'The World of Coffee | Hayyak' },
  about: { ar: 'من نحن | حيّاك', tr: 'Hakkımızda | Hayyak', en: 'About | Hayyak' }
};
const NAV = [['home', 'index.html', 'nav.home'], ['products', 'products.html', 'nav.products'], ['coffee', 'coffee.html', 'nav.coffee'], ['about', 'about.html', 'nav.about']];

export const HYK = { lang: detectLang(), pageSound: null };
export const t = (k) => (T[HYK.lang] && T[HYK.lang][k]) || T.en[k] || k;
export const waLink = (text) => `https://wa.me/${BRAND.wa}?text=${encodeURIComponent(text)}`;
window.HYK = HYK; HYK.t = t; HYK.waLink = waLink;

function buildChrome() {
  const hdr = document.getElementById('hdr');
  if (hdr) hdr.outerHTML = `
  <header class="hdr" id="hdrbar">
    <a class="brand" href="index.html" aria-label="${BRAND.name}">${markSVG()}<span class="bn"><b>${BRAND.name}</b><em>${BRAND.nameAr}</em></span></a>
    <nav class="nav" aria-label="Main">${NAV.map(([id, href, k]) => `<a href="${href}" ${PAGE === id ? 'class="on" aria-current="page"' : ''} data-i18n="${k}"></a>`).join('')}</nav>
    <div class="tools">
      <div class="lang" role="group" aria-label="Language">${LANGS.map(l => `<button type="button" data-lang="${l}" aria-pressed="false">${l.toUpperCase()}</button>`).join('')}</div>
      ${PAGE === 'home' ? `<button class="snd" id="sndBtn" type="button" aria-pressed="false" data-i18n-aria="nav.sound" aria-label="Sound"><svg class="off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l4 6M21 9l-4 6"/></svg><svg class="on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg></button>` : ''}
      <a class="btn gold cta" href="index.html#contact" data-i18n="nav.quote"></a>
      <button class="burger" type="button" aria-label="Menu" data-i18n-aria="nav.menu"><i></i></button>
    </div>
  </header>
  <div class="mnav" id="mnav">${NAV.map(([id, href, k]) => `<a href="${href}" data-i18n="${k}"></a>`).join('')}<a href="index.html#contact" data-i18n="nav.contact"></a></div>`;

  const ftr = document.getElementById('ftr');
  if (ftr) ftr.outerHTML = `
  <footer class="ftr"><div class="wrap">
    <div class="fgrid">
      <div>
        <a class="brand" href="index.html">${markSVG()}<span class="bn"><b>${BRAND.name}</b><em>${BRAND.nameAr}</em></span></a>
        <p data-i18n="f.tag"></p>
        <p class="demo-note" data-i18n="f.demo"></p>
      </div>
      <div><h4 data-i18n="f.links"></h4><ul>${NAV.map(([id, href, k]) => `<li><a href="${href}" data-i18n="${k}"></a></li>`).join('')}<li><a href="index.html#contact" data-i18n="nav.contact"></a></li></ul></div>
      <div><h4 data-i18n="f.contact"></h4><ul>
        <li><a href="${waLink('')}" target="_blank" rel="noopener">WhatsApp</a></li>
        <li data-i18n="c.hours"></li><li data-i18n="c.addr"></li></ul></div>
    </div>
    <div class="fbar"><span>© ${BRAND.year} ${BRAND.name} — demo</span><span><span data-i18n="f.by"></span> <a href="https://housinasaad-creator.github.io/mohammed-studio/" target="_blank" rel="noopener">MOHAMMED Web Studio</a></span></div>
  </div></footer>
  <a class="wa-float" href="${waLink('')}" target="_blank" rel="noopener" aria-label="WhatsApp">${ICON.wa}</a>`;
}

export function applyLang(lang) {
  if (!LANGS.includes(lang)) lang = 'ar';
  HYK.lang = lang;
  document.documentElement.lang = lang;
  try { localStorage.setItem('hyk-lang', lang); } catch (e) {}
  document.title = (TITLES[PAGE] || TITLES.home)[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === lang ? 'true' : 'false'));
  window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

function init() {
  buildChrome();
  const bar = document.getElementById('hdrbar');
  const onScroll = () => bar && bar.classList.toggle('solid', scrollY > 24);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });
  document.querySelectorAll('.lang button').forEach(b => b.addEventListener('click', () => applyLang(b.dataset.lang)));
  const burger = document.querySelector('.burger'), mnav = document.getElementById('mnav');
  if (burger) { burger.addEventListener('click', () => { const o = mnav.classList.toggle('open'); document.body.style.overflow = o ? 'hidden' : ''; }); mnav.addEventListener('click', (e) => { if (e.target.tagName === 'A') { mnav.classList.remove('open'); document.body.style.overflow = ''; } }); }
  applyLang(HYK.lang);
  // الظهور عند التمرير
  const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  const watch = () => document.querySelectorAll('.reveal:not(.in)').forEach(el => io.observe(el));
  watch(); window.addEventListener('hyk-rerender', watch);
  // روابط # من صفحات أخرى
  if (location.hash) setTimeout(() => { const el = document.querySelector(location.hash); if (el) el.scrollIntoView(); }, 350);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

export { ICON };
