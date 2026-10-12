/* صفحة عالم القهوة: سلّم التحميص التفاعلي، حاسبة التحضير، لعبة اقلب الفنجان. */
import { HYK, t } from './layout.js';
import { Fortune } from './fortune.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

/* ------------------------------------------------------------ سلّم التحميص */
const RAMP = [[0, [138, 152, 85]], [.2, [205, 178, 94]], [.4, [168, 107, 48]], [.62, [97, 47, 20]], [.82, [48, 23, 11]], [1, [23, 11, 6]]];
const ROAST_T = [[0, 25], [0.22, 150], [0.42, 196], [0.65, 210], [0.85, 224], [1, 236]];
const lerp = (a, b, t) => a + (b - a) * t;
function rampColor(r) { for (let i = 0; i < RAMP.length - 1; i++) { const [a, ca] = RAMP[i], [b, cb] = RAMP[i + 1]; if (r <= b) { const u = (r - a) / (b - a); return ca.map((v, k) => Math.round(lerp(v, cb[k], u))); } } return RAMP[RAMP.length - 1][1]; }
function tempOf(r) { for (let i = 0; i < ROAST_T.length - 1; i++) if (r <= ROAST_T[i + 1][0]) { const a = ROAST_T[i], b = ROAST_T[i + 1]; return lerp(a[1], b[1], (r - a[0]) / (b[0] - a[0])); } return 236; }
function stageOf(r) { return r < .2 ? 0 : r < .36 ? 1 : r < .55 ? 2 : r < .78 ? 3 : r < .92 ? 4 : 5; }
function renderRoast() {
  const r = +$('#roRange').value / 100, c = rampColor(r), st = stageOf(r);
  $('#beanBody').setAttribute('fill', `rgb(${c})`);
  $('#beanCrease').setAttribute('stroke', `rgb(${c.map(v => Math.round(v * .38))})`);
  $('#beanGloss').setAttribute('opacity', (Math.max(0, r - .55) * .9).toFixed(2));
  $('#roName').textContent = t('j.s' + st); $('#roTemp').textContent = Math.round(tempOf(r));
  $('#roNote').textContent = t('w.ro.n' + st); $('#roUse').textContent = t('w.ro.u' + st);
}

/* ------------------------------------------------------------ حاسبة التحضير */
const calc = { cups: 4, method: 'dallah', sugar: 1 };
function renderCalc() {
  const n = calc.cups; $('#cupsV').textContent = n;
  const dal = calc.method === 'dallah'; $('#sugarBox').hidden = dal; $('#oSugarBox').style.display = dal ? 'none' : '';
  let water, coffee, card, sugar, time;
  if (dal) { water = n * 75; coffee = water / 1000 * 20; card = coffee * 0.12; sugar = 0; time = 10 + Math.round(n * 0.4); }
  else { water = n * 70; coffee = n * 6.5; card = n * 0.3; sugar = n * [0, 3, 6][calc.sugar]; time = 3 + Math.ceil(n / 4); }
  const f1 = (x) => (Math.round(x * 10) / 10).toString();
  $('#oCoffee').innerHTML = `${f1(coffee)}<small>g</small>`; $('#oWater').innerHTML = `${Math.round(water / 5) * 5}<small>ml</small>`;
  $('#oCard').innerHTML = `${f1(card)}<small>g</small>`; $('#oSugar').innerHTML = `${f1(sugar)}<small>g</small>`;
  $('#oTime').innerHTML = `${time}<small>${t('w.b.min')}</small>`;
  $('#oTip').textContent = t(dal ? 'w.b.tip.d' : 'w.b.tip.r');
}

/* ------------------------------------------------------------ اقلب الفنجان */
let fortune = null, keys = [];
function renderReading() {
  const ul = $('#fList'); ul.innerHTML = keys.map((k, i) => `<li data-k="${k}"><i>${i + 1}</i><span>${t('sym.' + k)}</span></li>`).join('');
  [...ul.children].forEach((li, i) => setTimeout(() => li.classList.add('in'), 120 + i * 380));
}
function setupFortune() {
  fortune = new Fortune($('#fCv'), {
    onReveal: (ks) => { keys = ks; $('#fRead').hidden = false; renderReading(); },
    onReset: () => { $('#fRead').hidden = true; keys = []; $('#fHint').style.opacity = 1; $('#fGo').disabled = false; }
  });
  const io = new IntersectionObserver((es) => es.forEach(e => e.isIntersecting ? fortune.start() : fortune.stop()), { threshold: 0.05 });
  io.observe($('#fcup'));
  const go = () => { if (fortune.state !== 'idle') return; $('#fHint').style.opacity = 0; $('#fGo').disabled = true; fortune.run($('#fName').value); };
  $('#fGo').addEventListener('click', go); $('#fcup').addEventListener('click', go);
  $('#fName').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  $('#fAgain').addEventListener('click', () => fortune.reset());
}

/* ------------------------------------------------------------ ربط */
function init() {
  $('#roRange').addEventListener('input', renderRoast);
  $('#cups').addEventListener('input', (e) => { calc.cups = +e.target.value; renderCalc(); });
  $('#method').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; calc.method = b.dataset.m; $$('#method button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); renderCalc(); });
  $('#sugar').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; calc.sugar = +b.dataset.s; $$('#sugar button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); renderCalc(); });
  setupFortune(); renderRoast(); renderCalc();
}
window.addEventListener('langchange', () => { if (!$('#roRange')) return; renderRoast(); renderCalc(); if (keys.length) renderReading(); });
init();
