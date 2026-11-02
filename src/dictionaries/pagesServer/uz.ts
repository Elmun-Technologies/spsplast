/**
 * Faqat serverda ishlatiladigan sahifa matnlari — uz (asosiy): SEO landing (teglar, eksport
 * davlatlari, qo'llanma) va maxfiylik sahifasi. `pages/uz.ts` dan ajratildi (audit 2026-11-02,
 * tezlik): `getPages()` mijoz komponentlarida (model, zayafka, solishtirish, ulgurji) ham ishlatiladi
 * va lug'at uch tilda brauzerga to'liq tushardi. Matnlar CMS kalitlari o'zgarmagan: `pages.seo.*`,
 * `pages.privacy.*` (`src/lib/pagesServer.ts`).
 */
export const pagesServerUz = {
  privacy: {
    title: 'Maxfiylik siyosati',
    updated: 'Oxirgi yangilanish:',
    updatedMeta: '',
    tocLabel: 'Mundarija',
    summary: "Qisqasi: biz faqat zayafkangizga javob berish uchun kerakli ma'lumotni olamiz, uni sotmaymiz va uchinchi shaxslarga reklama uchun bermaymiz.",
    toc: [
      "1. Qanday ma'lumot olamiz",
      '2. Nima uchun ishlatamiz',
      '3. Qayerda saqlanadi',
      '4. Cookie va analitika',
      '5. Sizning huquqlaringiz',
      "6. Bog'lanish",
    ],
    sections: [
      {
        id: 'p1',
        h2: "1. Qanday ma'lumot olamiz",
        p: ["Zayafka yoki aloqa formasini to'ldirganingizda:"],
        ul: [
          'ism, telefon raqami (WhatsApp), shahar yoki davlat;',
          "kompaniya nomi va mijoz turi (sex, diler, quruvchi, xususiy) — agar ko'rsatsangiz;",
          'tanlangan modellar, kunlik hajm (m²) va izoh;',
          'qaysi sahifadan yuborilgani va reklama manbasi (UTM belgilari).',
        ],
        p2: ["Solishtirish va zayafka ro'yxati faqat sizning brauzeringizda saqlanadi va bizga yuborilmaydi — zayafkani o'zingiz jo'natmaguningizcha."],
      },
      {
        id: 'p2',
        h2: '2. Nima uchun ishlatamiz',
        p: [],
        ul: [
          'zayafkangiz bo\'yicha qolip soni va narxini hisoblab, siz bilan bog\'lanish;',
          'buyurtma, yetkazish va hujjatlarni rasmiylashtirish;',
          "sayt va reklamaning samaradorligini o'lchash (umumlashtirilgan holda).",
        ],
        p2: [],
      },
      {
        id: 'p3',
        h2: '3. Qayerda saqlanadi',
        p: [
          "Zayafka himoyalangan serverdagi ma'lumotlar bazasida saqlanadi va savdo bo'limining yopiq Telegram chatiga yuboriladi. Unga faqat SPS menejerlari kiradi. Ma'lumotlar hamkorlik davomida va qonunda belgilangan muddatlarda saqlanadi; so'rovingiz bo'yicha o'chiriladi.",
        ],
        ul: [],
        p2: [],
      },
      {
        id: 'p4',
        h2: '4. Cookie va analitika',
        p: [
          "Sayt tashriflarni hisoblash uchun o'z statistikasidan (cookie'siz, IP manzil saqlanmaydi) va yoqilgan bo'lsa Google Analytics, Yandex Metrica (jumladan Vebvizor — sahifadagi harakatlar; forma maydonlariga yozilgan matn yozib olinmaydi) hamda Meta Pixel'dan foydalanadi. Ular shaxsingizni aniqlamaydi. Zayafka formasini suiiste'moldan himoya qilish uchun IP manzilning qaytarib bo'lmaydigan xeshi (IP'ning o'zi emas) ko'pi bilan 1 sutka saqlanadi va o'chiriladi. Brauzer sozlamalarida cookie'larni o'chirib qo'yishingiz mumkin.",
        ],
        ul: [],
        p2: [],
      },
      {
        id: 'p5',
        h2: '5. Sizning huquqlaringiz',
        p: [
          'Siz biz saqlayotgan ma\'lumot haqida so\'rash, uni tuzatish yoki o\'chirishni talab qilishingiz mumkin. Buning uchun quyidagi kontaktlarga yozing — 3 ish kuni ichida javob beramiz.',
        ],
        ul: [],
        p2: [],
      },
      {
        id: 'p6',
        h2: "6. Bog'lanish",
        p: [
          '{contactLine}',
          '{addressLine}',
        ],
        ul: [],
        p2: [],
      },
    ],
    legalNote: 'Matn yuridik tekshiruvdan o\'tkazilishi kerak (O\'zbekiston "Shaxsga doir ma\'lumotlar to\'g\'risida"gi qonuni). [YURIST TASDIG\'I]',
  },
  seo: {
    /** Bo'lim sahifasi pastidagi barcha modellar ro'yxati (sarlavha). */
    modelIndexTitle: (section: string) => `${section}: barcha modellar`,
    tagNavLabel: "Ommabop tanlovlar",
    tagCrumb: 'Tanlov',
    tagCountLabel: 'model',
    tagAllLink: "Bo'limdagi barcha modellar",
    tagOther: 'Boshqa tanlovlar',
    tags: {
      'walk-25-30': {
        name: "Piyoda yo'lak · 25–30 mm",
        title: "Piyoda yo'lak uchun plitka qoliplari 25–30 mm",
        h1: "Piyoda yo'lak uchun trotuar plitkasi qoliplari (25–30 mm)",
        text: "Trotuar, piyoda va bog' yo'laklari uchun 25–30 mm qalinlikdagi plitka qoliplari. Kunlik hajmingizga qarab qolip sonini menejer hisoblaydi.",
      },
      'yard-35-40': {
        name: 'Hovli · 35–40 mm',
        title: 'Hovli uchun plitka qoliplari 35–40 mm',
        h1: 'Hovli va maydonchalar uchun plitka qoliplari (35–40 mm)',
        text: "Hovli, maydoncha va yengil yuk tushadigan joylar uchun 35–40 mm qalinlikdagi plitka qoliplari. Qolip soni va narxini menejer hisoblaydi.",
      },
      'parking-45-50': {
        name: 'Avtoturargoh · 45–50 mm',
        title: 'Avtoturargoh uchun plitka qoliplari 45–50 mm',
        h1: 'Avtoturargoh va darvoza oldi uchun plitka qoliplari (45–50 mm)',
        text: "Avtoturargoh, darvoza oldi va og'ir yuk tushadigan joylar uchun 45–50 mm qalinlikdagi plitka qoliplari. Hisob-kitobni menejer qiladi.",
      },
      '300x300': {
        name: '300 × 300',
        title: '300×300 trotuar plitkasi qoliplari',
        h1: '300×300 mm trotuar plitkasi qoliplari',
        text: "Eng ko'p so'raladigan kvadrat format: 300×300 mm plitka uchun qoliplar, 1 m² ga taxminan 11 dona. Kunlik hajm bo'yicha qolip sonini hisoblaymiz.",
      },
      '200x200': {
        name: '200 × 200',
        title: '200×200 trotuar plitkasi qoliplari',
        h1: '200×200 mm trotuar plitkasi qoliplari',
        text: "Kichik kvadrat format: 200×200 mm plitka uchun qoliplar, 1 m² ga 25 dona. Kunlik hajmingiz bo'yicha qolip sonini menejer hisoblaydi.",
      },
      figured: {
        name: 'Figurali',
        title: 'Figurali trotuar plitkasi qoliplari',
        h1: 'Figurali va naqshli trotuar plitkasi qoliplari',
        text: "Figurali va naqshli plitka qoliplari: to'lqin, gul, kirpich, rombik va boshqa shakllar. Har bir modelda qolip surati va terilgan ko'rinish bor.",
      },
      sets: {
        name: "To'plamlar (2–3 qolip)",
        title: "To'plamli plitka qoliplari (2–3 qolip)",
        h1: "To'plamli trotuar plitkasi qoliplari (2–3 qolip)",
        text: "Bir naqsh uchun 2 yoki 3 xil qolipdan iborat to'plamlar — terilganda murakkab rasm hosil bo'ladi. To'plam uchun qolip sonini menejer hisoblaydi.",
      },
    },
    guide: {
      title: 'Trotuar plitkasi qolipini qanday tanlash kerak',
      thicknessTitle: "1. Qalinlik — qo'llanish joyiga qarab",
      colUse: "Qo'llanish",
      colThickness: 'Qalinlik',
      colModels: 'Modellar',
      countTitle: '2. Nechta qolip kerak',
      countText: (name: string, per: string, m2: number, molds: string) =>
        `Kunlik hajmni 1 m² dagi plitka soniga ko'paytiring. ${name} (1 m² ga ${per} dona) uchun kuniga ${m2} m² — taxminan ${molds} qolip, kuniga bitta aylanmada. Har bir model sahifasida kalkulyator bor.`,
      materialTitle: '3. Material: PP yoki ABS',
      materialText: "Har bir model ikkala materialda ishlab chiqariladi. Qaysi biri ishlab chiqarishingizga mosligini menejer hajm va sex rejimiga qarab tavsiya qiladi.",
    },
    geo: {
      crumb: 'Eksport',
      stripTitle: 'Qoliplarni {countries} davlatga yetkazamiz',
      otherTitle: 'Boshqa davlatlarga ham yetkazamiz',
      title: (to: string) => `Trotuar plitkasi qoliplari — ${to} yetkazish`,
      h1: (to: string) => `${to} yetkazib berish bilan trotuar plitkasi qoliplari`,
      description: (to: string, count: number) =>
        `${count} ta plastik qolip modeli Toshkentdagi zavoddan ${to} yetkaziladi. Eksport hujjatlari va qadoqlash bizda, narxni menejer hisoblaydi.`,
      lead: (to: string, count: number) =>
        `Trotuar plitkasi, fasad va dekor uchun ${count} ta plastik qolip modeli — to'g'ridan-to'g'ri Toshkentdagi zavoddan. ${to} jo'natamiz: eksport hujjatlari va qadoqlashni o'zimiz tayyorlaymiz, yetkazish bilan birga qolip soni va narxini menejer hisoblaydi.`,
      ctaLead: 'Yetkazish bilan hisoblash',
      ctaWhatsapp: "WhatsApp'da yozish",
      stepsTitle: 'Qanday ishlaymiz',
      modelsTitle: "Ko'p so'raladigan qoliplar",
      allModels: 'Butun katalog',
      formTitle: 'Zayafka qoldiring',
      faqTitle: 'Savol-javob',
      faq: (c: { to: string; from: string; cities: string }) => [
        { q: `${c.to} yetkazish qancha turadi?`, a: "Hajm va shaharga bog'liq — menejer qoliplar narxi bilan birga hisoblab beradi." },
        { q: 'Qanday hujjatlar tayyorlaysiz?', a: "Eksport hujjatlari va qadoqlashni o'zimiz tayyorlaymiz: invoys va qadoqlash ro'yxati. Yetkazishingiz uchun to'liq ro'yxatni menejer aytadi." },
        { q: `${c.from} ulgurji olsa bo'ladimi?`, a: "Ha, plitka sexlari, dilerlar va qurilish kompaniyalari bilan ishlaymiz. Ulgurji shartlar menejer bilan kelishiladi." },
        { q: 'Zayafkani qanday qoldiraman?', a: `Shu sahifadagi forma, WhatsApp yoki Telegram orqali. Modellar, kunlik hajm va shaharni yozing — masalan, ${c.cities}.` },
      ],
      countries: {
        russia: { name: 'Rossiya', to: 'Rossiyaga', from: 'Rossiyadan', cities: 'Moskva, Sankt-Peterburg yoki Qozon' },
        kazakhstan: { name: "Qozog'iston", to: "Qozog'istonga", from: "Qozog'istondan", cities: 'Olmaota, Astana yoki Chimkent' },
        belarus: { name: 'Belarus', to: 'Belarusga', from: 'Belarusdan', cities: 'Minsk, Gomel yoki Brest' },
        kyrgyzstan: { name: "Qirg'iziston", to: "Qirg'izistonga", from: "Qirg'izistondan", cities: "Bishkek yoki O'sh" },
        tajikistan: { name: 'Tojikiston', to: 'Tojikistonga', from: 'Tojikistondan', cities: "Dushanbe yoki Xo'jand" },
        azerbaijan: { name: 'Ozarbayjon', to: 'Ozarbayjonga', from: 'Ozarbayjondan', cities: 'Boku yoki Ganja' },
        armenia: { name: 'Armaniston', to: 'Armanistonga', from: 'Armanistondan', cities: 'Yerevan yoki Gyumri' },
        georgia: { name: 'Gruziya', to: 'Gruziyaga', from: 'Gruziyadan', cities: 'Tbilisi, Batumi yoki Kutaisi' },
      },
    },
  },
};

export type PagesServerDictionary = typeof pagesServerUz;
