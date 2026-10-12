/*
  هوية العلامة في مكان واحد: لتبديل الاسم/الشعار/الأرقام لاحقاً (مثلاً لو اعتُمد العرض لعميل حقيقي) يكفي تعديل هذا الملف.
  العلامة "حيّاك / HAYYAK" مخترعة لغرض العرض (نموذج جاهز لمحمصة قهوة عربية)، ولا ترتبط بأي نشاط تجاري حقيقي.
*/
export const BRAND = {
  name: 'HAYYAK',
  nameAr: 'حيّاك',
  nameTr: 'Hayyak',
  wa: '905537410520',            // رقم الاستوديو للتجربة؛ يُستبدل برقم صاحب المحمصة الحقيقي
  email: 'hello@hayyak.example',
  city: { ar: 'إسطنبول', tr: 'İstanbul', en: 'Istanbul' },
  gold: '#d9a441',
  year: new Date().getFullYear()
};

/* ختم العلامة: فنجان بلا يد يتصاعد منه بخار داخل حلقتين من الخرز */
export const MARK_PATHS = {
  bowl: 'M30 56 H70 C70 70 62 78 50 78 C38 78 30 70 30 56 Z',
  foot: 'M44 78 H56 L58 83 H42 Z',
  steam: ['M42 48 C38 42 46 38 42 31', 'M50 48 C46 41 54 36 50 27', 'M58 48 C54 42 62 38 58 31']
};

export function markSVG(cls = '') {
  return `<svg class="mark ${cls}" viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="currentColor">
    <circle cx="50" cy="50" r="46" stroke-width="2.2"/>
    <circle cx="50" cy="50" r="40.5" stroke-width="1.1" stroke-dasharray="0.1 2.6" stroke-linecap="round"/>
    <path d="${MARK_PATHS.bowl}" fill="currentColor" stroke="none"/>
    <path d="${MARK_PATHS.foot}" fill="currentColor" stroke="none"/>
    <path d="M27 56 H73" stroke-width="2" stroke-linecap="round"/>
    ${MARK_PATHS.steam.map(d => `<path d="${d}" stroke-width="2.4" stroke-linecap="round"/>`).join('')}
  </svg>`;
}

/* نفس الختم على canvas (لرسم الشعار على الفنجان ثلاثي الأبعاد والعبوات) */
export function drawMark(g, cx, cy, r, color = '#c99a46', bg = null) {
  g.save(); g.translate(cx - r, cy - r); g.scale(r / 50, r / 50);
  if (bg) { g.fillStyle = bg; g.beginPath(); g.arc(50, 50, 46, 0, 6.3); g.fill(); }
  g.strokeStyle = color; g.fillStyle = color; g.lineCap = 'round';
  g.lineWidth = 2.4; g.beginPath(); g.arc(50, 50, 46, 0, 6.3); g.stroke();
  g.lineWidth = 1.2; g.setLineDash([0.1, 2.6]); g.beginPath(); g.arc(50, 50, 40.5, 0, 6.3); g.stroke(); g.setLineDash([]);
  g.fill(new Path2D(MARK_PATHS.bowl)); g.fill(new Path2D(MARK_PATHS.foot));
  g.lineWidth = 2; g.beginPath(); g.moveTo(27, 56); g.lineTo(73, 56); g.stroke();
  g.lineWidth = 2.6; for (const d of MARK_PATHS.steam) g.stroke(new Path2D(d));
  g.restore();
}
