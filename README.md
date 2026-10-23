# حيّاك · HAYYAK — موقع عرض لمحمصة قهوة عربية وسورية

**ما هو:** نموذج جاهز (Concept Demo) لموقع محمصة قهوة تبيع بالجملة، بثلاث لغات (العربية / التركية / الإنجليزية)، بعلامة **مخترعة** («حيّاك») لا تمثّل أي نشاط حقيقي. صُنع ليُعرض على أصحاب محامص قهوة عربية/سورية، ويمكن استبدال الهوية بسهولة عند اعتماده.

**الفكرة المميّزة:** «ولا تنتهي القهوة حتى تهزّ الفنجان». رحلة ثلاثية الأبعاد مرتبطة بالتمرير (حبّة هال ← تحميص بطقطقتين وحرارة حقيقية ← طحن ← فنجان وحبوب وهيل ← صبّ وسطح قهوة بزَبَد ← طقس ضيافة تفاعلي) ينتهي بأن يواصل المضيف الصبّ ويعدّ الفناجين (الأولى للضيف، الثانية للكيف، الثالثة للسيف) إلى أن يهزّ الزائر الفنجان (فأرة/إصبع/هاتف أو زرّ). الهزّ **اختياري**: لو تابع الزائر التمرير يهتزّ الفنجان من تلقاء نفسه وتنفتح الصفحة، فلا قفل ولا زرّ إلزامي.

## تشغيل محلي
`run-site.bat` (يحتاج Python) ثم افتح http://localhost:3500 — لا يعمل بالنقر المزدوج على index.html لأن الموقع يستخدم ES modules.

## الصفحات
- `index.html` الرحلة + قهوتان (مرّة/حلوة) + منتجات مختارة + لعبة الفنجان + طريقة العمل + نموذج طلب (يفتح واتساب برسالة جاهزة).
- `products.html` 8 منتجات بالجملة مع مرشّحات وطلب عرض سعر.
- `coffee.html` آداب الضيافة، مقارنة المرّة والحلوة، سلّم التحميص التفاعلي، حاسبة التحضير، لعبة «اقلب الفنجان» (للتسلية).
- `about.html` القصة والقيم وسلسلة الإنتاج ولمن نورّد.

## استبدال الهوية (لعميل حقيقي)
- الاسم/الرقم/المدينة: `js/brand.js` (BRAND). رقم واتساب الحالي رقم الاستوديو للتجربة.
- الشعار: `js/brand.js` (MARK_PATHS) + `assets/favicon.svg`.
- النصوص بالثلاث لغات: `js/i18n.js`؛ المنتجات: `js/data.js`.
- صور العبوات: تُولَّد من `tools/studio.js` (ألوان وملصق كل منتج في `CFG`) ثم `python tools/render_products.py` (والموقع شغّال على 3500).
- صورتا `poster.jpg` و`og.jpg`: `python tools/make_images.py`.

## تقنية
three.js (محلي في js/vendor) بلا أي مكتبة خارجية؛ الخطوط محلية (`python tools/get_fonts.py` لإعادة تنزيلها)؛ كل المجسّمات والأصوات مولّدة بالكود. الأصوات مطفأة افتراضياً (زر في الترويسة). عند غياب WebGL يظهر نصّ الفصول فقط بخلفية الصورة. ملف `test3d.html` صفحة تجارب داخلية للمشهد (`?p=0.5`).

## ملاحظات
- كل الأسماء والمنتجات والعناوين والأرقام للتوضيح فقط. «اقلب الفنجان» للتسلية ولا يدّعي معرفة الغيب.
- لم يُنشر الموقع على الإنترنت بعد.

## Hero: four-stop video (2026-10-23)
The hero is rendered offline (60 fps) from the live 3D scene and shipped as eight short H.264 clips per device class in `assets/hero/desktop|phone/` (`f0..f3` play forward from one stop to the next, `r0..r3` are the same frames in reverse order, so going back is a clip played forward, never reverse playback or seeking). `js/hero-video.js` plays them on one canvas in exactly four scroll gestures: each wheel notch / swipe / arrow key / dot plays the next clip by itself and stops on its last frame; a gesture in the same direction mid-clip speeds it up and chains, the opposite direction continues from the same frame in the mirrored clip. Clips are loaded as blobs (forward ones in the background, the reverse one when a stop is reached), at most three video elements exist at a time, and everything is released from memory when the hero is far away. The live 3D scene stays in the files and the earlier live-3D versions of the changed files are in `_live3d_version/`; a video failure hides the hero scene and the page scrolls normally. Re-render with `_hero_video_tools/capture.py` + `encode_site_clips.py`.
