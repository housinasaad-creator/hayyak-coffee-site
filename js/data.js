/*
  منتجات العرض (علامة مخترعة). الصور مولّدة من استوديو ثلاثي الأبعاد داخلي (tools/studio.html) ولا تمثّل منتجاً حقيقياً.
*/
const L = (ar, tr, en) => ({ ar, tr, en });

export const PRODUCTS = [
  { id: 'murra', cat: 'arabic', packs: ['250 g', '500 g', '1 kg'],
    name: L('قهوة عربية مرّة بالهيل', 'Kakuleli acı Arap kahvesi', 'Arabic coffee with cardamom'),
    roast: L('فاتح', 'Açık', 'Light'),
    desc: L('جاهزة للدلّة: تحميص فاتح مع هيل مطحون طازج، بقوام خفيف وعطر واضح.', 'Dallah’a hazır: açık kavrum ve taze öğütülmüş kakule; hafif gövde, belirgin koku.', 'Dallah-ready: a light roast blended with freshly ground cardamom, delicate in body and clear in aroma.') },
  { id: 'saffron', cat: 'arabic', packs: ['250 g', '500 g'],
    name: L('قهوة عربية بالزعفران', 'Safranlı Arap kahvesi', 'Arabic coffee with saffron'),
    roast: L('فاتح', 'Açık', 'Light'),
    desc: L('خيوط زعفران مع الهيل لضيافة المناسبات والفنادق: لونها ذهبي ورائحتها فاخرة.', 'Özel günler ve oteller için safran ve kakule: altın rengi, seçkin bir koku.', 'Saffron threads with cardamom for occasions and hotels: golden in colour, refined in scent.') },
  { id: 'sweet', cat: 'syrian', packs: ['250 g', '500 g', '1 kg'],
    name: L('قهوة حلوة بالهيل (سورية)', 'Kakuleli tatlı Suriye kahvesi', 'Sweet Syrian coffee with cardamom'),
    roast: L('متوسط إلى غامق', 'Ortadan koyuya', 'Medium to dark'),
    desc: L('ناعمة جداً للركوة مع هيل خفيف؛ وجهٌ كثيف وطعم مستدير.', 'Cezve için çok ince, hafif kakulu; yoğun köpük ve yuvarlak bir tat.', 'Very fine for the rakwa, lightly cardamom-scented; a thick foam and a rounded taste.') },
  { id: 'plain', cat: 'syrian', packs: ['250 g', '500 g', '1 kg'],
    name: L('قهوة سورية سادة', 'Sade Suriye kahvesi', 'Plain Syrian coffee'),
    roast: L('متوسط إلى غامق', 'Ortadan koyuya', 'Medium to dark'),
    desc: L('بنّ نقيّ بلا هيل، لمن يحب طعم الحبّة وحده.', 'Kakulesiz saf kahve; çekirdeğin tadını tek başına sevenler için.', 'Pure coffee without cardamom, for those who love the taste of the bean alone.') },
  { id: 'espresso', cat: 'beans', packs: ['1 kg', '5 kg'],
    name: L('حبوب إسبريسو', 'Espresso çekirdek', 'Espresso beans'),
    roast: L('متوسط غامق', 'Orta-koyu', 'Medium-dark'),
    desc: L('خلطة متوازنة بكريمة كثيفة ونكهة شوكولاتة، للمقاهي والمطاعم.', 'Yoğun krema ve çikolata notalı dengeli harman; kafeler ve restoranlar için.', 'A balanced blend with dense crema and chocolate notes, for cafés and restaurants.') },
  { id: 'sticks', cat: 'arabic', packs: ['24 × 4 g'],
    name: L('قهوة عربية سريعة بأكياس', 'Hazır Arap kahvesi saşe', 'Instant Arabic coffee sachets'),
    roast: L('فاتح', 'Açık', 'Light'),
    desc: L('كيس واحد وكوب ماء ساخن: ضيافة جاهزة للمكاتب والفنادق والطائرات.', 'Bir saşe ve sıcak su: ofisler, oteller ve seyahat için hazır ikram.', 'One sachet and hot water: ready hospitality for offices, hotels and travel.') },
  { id: 'cardamom', cat: 'extras', packs: ['100 g', '250 g', '1 kg'],
    name: L('هيل أخضر بقرونه', 'Yeşil kakule (kabuklu)', 'Whole green cardamom pods'),
    roast: L('—', '—', '—'),
    desc: L('قرون كاملة منتقاة بحجم متقارب وعطر قوي؛ تُكسَّر قبل الاستعمال.', 'Boyları birbirine yakın, güçlü kokulu seçilmiş bütün kabuklar; kullanmadan önce ezilir.', 'Selected whole pods of even size and strong aroma; crack them just before use.') },
  { id: 'diyafa', cat: 'extras', packs: ['1 box'],
    name: L('علبة الضيافة', 'İkram kutusu', 'The hospitality box'),
    roast: L('فاتح', 'Açık', 'Light'),
    desc: L('قهوة عربية وهيل وتمر في علبة هدايا أنيقة؛ للمناسبات وهدايا الشركات.', 'Şık bir hediye kutusunda Arap kahvesi, kakule ve hurma; özel günler ve kurumsal hediyeler için.', 'Arabic coffee, cardamom and dates in an elegant gift box; for occasions and corporate gifts.') }
];

export const FEATURED = ['murra', 'sweet', 'cardamom'];
