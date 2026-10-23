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

## Hero: looping video (2026-10-23)
The hero is one light looping video per device class (`assets/hero/loop-desktop.mp4` 1920x1080, `assets/hero/loop-phone.mp4` 720 wide, about 1-6 MB each), rendered offline from the live 3D scene: the journey plays forward and then back in reverse, so the loop wraps with no cut. It has nothing to do with scrolling: `js/hero-video.js` just sets it to `loop`, plays it while the hero is on screen, pauses it as soon as the hero leaves the viewport, and removes the source (frees the memory) when the visitor is far from the hero. Scrolling is plain native scrolling; the text chapters follow the scroll position as before. The poster stays until the first frame plays (and on browsers that block autoplay, such as iPhone Low Power Mode, until the first touch). `?hero=off`, data-saver and reduced motion keep the still poster. Earlier versions: four-stop clips (`_clips_four_stop_version/`), image sequence, live 3D (`_live3d_version/`, git history). Re-render with `_hero_video_tools/capture.py` then `encode_loop.py`.
