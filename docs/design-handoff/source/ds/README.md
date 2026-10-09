SPS Plast — Toshkentdagi zavod. Trotuar plitkasi, fasad, zabor va dekor elementlari uchun polipropilen va ABS qoliplar ishlab chiqaradi va 8 davlatga eksport qiladi. Bu tizim xalqaro B2B sayt uchun. Auditoriya: plitka sexlari, qurilish kompaniyalari, distribyutorlar. Ular modelni kod, o'lcham va 1 m² sarfi bo'yicha tanlaydi. Shuning uchun dizayn hissiyotga emas, aniq ma'lumotga qurilgan: katta mahsulot rasmi, aniq raqamlar, bitta qizil aksent.

## Ovoz va matn

- **Faktlar, keyin sifat.** Raqam bilan ayting: "18 000 m² oyiga", "152 qolip", "8 davlat", "300 × 300 × 30 mm". "Yuqori sifat", "eng yaxshi" kabi umumiy gaplar yo'q.
- **Murojaat — "siz", kompaniya — "biz".** Qisqa gaplar, aktiv nisbat.
- **O'zbekcha matnda "yaratish" so'zi (har qanday shaklda) ishlatilmaydi.** O'rniga "ishlab chiqarilgan" yoziladi.
- Tillar: uz (asosiy), ru, en. Model nomlari ruschada kirillda (Монако), inglizchada ma'nosi bilan (Flower). Kod hamma tilda bir xil: `№ 04`, `F17`.
- O'lchamlar mm'da, ko'paytirish belgisi `×` (x emas), raqam va birlik orasida bo'sh joy: `30 mm`. Uz/ru'da o'nlik vergul (`3,52 kg`), en'da nuqta.
- Tugma matni fe'l bilan: "Narx so'rash", "Katalogni yuklab olish", "Namuna buyurtma qilish". "Batafsil" emas.
- Tasdiqlanmagan o'lcham `*` belgisi bilan, izohi: "* buyurtmada tasdiqlanadi".
- Emoji ishlatilmaydi.

Namuna matnlar:
- Hero (uz): "Bitta qolip. Minglab metr." / ost matni: "Toshkentda ishlab chiqarilgan. 8 davlatda ishlayapti."
- Hero (en): "One mold. Thousands of square metres."
- B2B blok (ru): "Оптовые условия для цехов и дистрибьюторов".

## Rang

- Fon `surface`. Katalog, jadval va forma bloklari `surface-alt` (beton kulrangi) ustida. Qora bo'limlar (eksport, footer, hero qatlami) `surface-ink`, ularning matni `on-ink`.
- `red` — yagona aksent. Faqat to'ldirilgan maydonlarda: asosiy tugma, bo'lim raqami, aktiv filtr belgisi. Bitta ekranda bitta asosiy qizil tugma.
- Qizil matn va havola — `red-ink` (`red` matn uchun yetarli kontrast bermaydi).
- `concrete` faqat dekorativ maqsadda: rasm o'rnini bosuvchi fon, chiziq.
- `success` va `warning` doim so'z bilan birga keladi: "Omborda bor", "Buyurtma bo'yicha".
- Dekorativ gradient ishlatilmaydi. Rasm ustidagi matn uchun faqat pastdan `surface-ink` rangiga o'tuvchi qorong'i qatlam qo'yiladi, shunda matn har doim `on-ink` rangida o'qiladi.

## Tipografiya

- `display` (Unbounded) — faqat sarlavhalar uchun: `display-xl`, `display-l`, `h1`, `h2`. Keng, og'ir, katalog muqovasidagi bilan bir xil. Bitta blokda bittadan ortiq display sarlavha bo'lmaydi.
- `sans` (IBM Plex Sans) — matn, tugma, forma.
- `mono` (IBM Plex Mono) — barcha texnik ma'lumotlar: model kodi (`code-xl`), o'lchamlar va vazn (`data`), bo'lim belgisi (`eyebrow`, doim UPPERCASE). Raqamlar ustunlarda tekislanadi (`tabular-nums`).
- Uchala oila ham lotin va kirillni qo'llaydi. Shriftlar Google Fonts orqali yuklanadi.

## Grid va oraliqlar

- Kontent kengligi `container-max` (1320px), 12 ustun, desktopda gutter `gutter`, mobilda `space-4`.
- Bo'limlar orasi desktopda `space-9`, mobilda `space-7`. Kartochka ichi `space-5`.
- Katalog panjarasi: 4 / 3 / 2 / 1 kartochka (≥1280 / ≥960 / ≥600 / mobil).
- Burchaklar to'g'ri: rasm, kartochka va bo'limlar `radius-0`. Tugma va input `radius-sm`. `radius-pill` faqat teg va til almashtirgichda.
- Soya faqat hover holatida (`shadow-raise`). Statik bloklar bir-biridan `line` chizig'i yoki fon rangi bilan ajratiladi.

## Rasmlar

- **Mahsulot**: 3D render (terilgan ko'rinish) va qolipning haqiqiy surati — `Products` guruhi. Plitka renderi shaffof fonda, `surface-alt` ustida.
- **Atmosfera**: zavod, eksport konteynerlari, ustalar ishi, tayyor hovli va yo'laklar — `Imagery` guruhi (Unsplash, bepul litsenziya).
- Odamlar faqat ish jarayonida tasvirlanadi, sun'iy pozada emas. Rasm nisbatlari: hero 16:9 yoki 4:5, kartochka 4:3, model sahifasi 3:4.

## Ikonalar

- Lucide ikon to'plami, 1.5px chiziq, 20/24px, rangi `currentColor`. Ikonasiz ishlasa — ikonasiz.
- Logo: oq fonda `sps-logo-ink.png`, `surface-ink` va rasm ustida `sps-logo-white.png`. Minimal balandlik 28px. Logoni qayta chizish yoki rangini o'zgartirish mumkin emas.

## Holatlar va harakat

- Fokus: 2px `focus` halqa, 2px offset, har bir interaktiv elementda.
- Hover: tugma rangi `red-hover`. Kartochka 2px ga ko'tariladi va `shadow-raise` oladi, 160ms ease-out. `prefers-reduced-motion` yoqilgan bo'lsa harakat yo'q.

## Komponentlar

Klasslar `sps-` prefiksi bilan `components/bundle.css` faylida. Har bir komponent sahifasida qanday ishlatilishi yozilgan: `Button`, `Tag`, `SectionHead`, `ProductCard`, `SpecTable`, `Stat`, `QuoteForm`, `SiteHeader`.
