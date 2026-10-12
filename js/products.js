/* صفحة المنتجات: مرشّحات الفئات + بطاقات لكل منتج مع طلب عرض سعر على واتساب. */
import { HYK, t, waLink } from './layout.js';
import { PRODUCTS } from './data.js';

const $ = (s) => document.querySelector(s);
const lname = (o) => o[HYK.lang] || o.en;
const CATS = ['all', 'arabic', 'syrian', 'beans', 'extras'];
let cat = new URLSearchParams(location.search).get('cat') || 'all';
if (!CATS.includes(cat)) cat = 'all';

function render() {
  $('#filters').innerHTML = CATS.map(c => `<button type="button" data-c="${c}" aria-pressed="${c === cat}">${t('p.f.' + c)}</button>`).join('');
  $('#grid').innerHTML = PRODUCTS.map((p, i) => `
    <article class="pcard reveal d${(i % 4) + 1} ${cat === 'all' || p.cat === cat ? '' : 'hide'}" data-cat="${p.cat}">
      <div class="img"><img src="assets/products/${p.id}.webp" alt="${lname(p.name)}" width="500" height="600" loading="${i < 4 ? 'eager' : 'lazy'}"></div>
      <h3>${lname(p.name)}</h3>
      <p>${lname(p.desc)}</p>
      ${p.roast.en !== '—' ? `<div class="roast">${t('p.roast')}: <b>${lname(p.roast)}</b></div>` : ''}
      <div class="packs"><span class="chip">${t('p.packs')}</span>${p.packs.map(x => `<span class="chip num">${x}</span>`).join('')}</div>
      <div class="go"><a class="btn gold" style="width:100%" href="${waLink(t('p.pack.cta') + ' ' + lname(p.name))}" target="_blank" rel="noopener"><span>${t('p.ask')}</span></a><div class="roast" style="margin-top:10px">${t('p.sample')}</div></div>
    </article>`).join('');
  window.dispatchEvent(new Event('hyk-rerender'));
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('#filters button'); if (!b) return;
  cat = b.dataset.c; history.replaceState(null, '', cat === 'all' ? 'products.html' : `products.html?cat=${cat}`);
  document.querySelectorAll('#filters button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  document.querySelectorAll('#grid .pcard').forEach(c => { const show = cat === 'all' || c.dataset.cat === cat; c.classList.toggle('hide', !show); if (show) c.classList.add('in'); });
});
window.addEventListener('langchange', render);
render();
