import type { Locale } from '@/lib/i18n';

/**
 * Ko'p beriladigan savollar — ikki tilda, bitta manbadan.
 *
 * Nega alohida modul: ilgari FAQ matni sahifa ichida hard-coded edi va faqat
 * o'zbekcha yozilgan edi (rus sahifasida ham o'zbekcha chiqardi), JSON-LD esa
 * undan alohida nusxada yurardi — ya'ni ko'rinadigan matn bilan strukturaviy
 * ma'lumot vaqt o'tib bir-biridan ajralib ketardi. Endi ikkalasi ham shu
 * fayldan o'qiydi.
 *
 * P0-8 qoidasi: tasdiqsiz raqam/da'vo yozilmaydi. Resurs, narx va muddat
 * haqida gapirganda "modelga bog'liq", "hajmga bog'liq" kabi aniq ifodalar
 * ishlatiladi.
 */

export interface FaqEntry {
  q: string;
  a: string;
}

export interface FaqItem {
  uz: FaqEntry;
  ru: FaqEntry;
}

/** Tanlangan tilga mos savol-javoblar ro'yxati. */
export function faqItems(items: FaqItem[], lang: Locale): FaqEntry[] {
  return items.map((item) => item[lang]);
}

/**
 * FAQPage JSON-LD — kirish har doim shu sahifada ko'rinadigan savol-javoblar
 * bo'lishi kerak (Google "ko'rinmaydigan" FAQ uchun ogohlantiradi).
 */
export function faqJsonLd(entries: FaqEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.q,
      acceptedAnswer: { '@type': 'Answer', text: entry.a },
    })),
  };
}

/** Bosh sahifa FAQ — savollar auditdagi eng ko'p so'raladigan mavzulardan. */
export const HOME_FAQ: FaqItem[] = [
  {
    uz: {
      q: 'Qoliplar qanday materialdan tayyorlanadi?',
      a: 'Qoliplarimiz polipropilen va ABS plastikdan tayyorlanadi. Qaysi material mos kelishi mahsulot modeliga va undan qanday foydalanishingizga bog‘liq — menejer tanlashda yordam beradi.',
    },
    ru: {
      q: 'Из какого материала сделаны формы?',
      a: 'Наши формы изготавливаются из полипропилена и ABS-пластика. Какой материал подойдёт именно вам — зависит от модели и интенсивности использования; менеджер поможет с выбором.',
    },
  },
  {
    uz: {
      q: 'Buyurtma qanday beriladi?',
      a: 'Saytdagi “Zayafka berish” tugmasini bosib ism, telefon raqami va qiziqtirgan mahsulotni qoldirasiz. Menejer qo‘ng‘iroq qilib, mavjudlik, narx va yetkazib berish shartlarini kelishadi.',
    },
    ru: {
      q: 'Как оформить заказ?',
      a: 'Нажмите «Оставить заявку» на сайте и укажите имя, номер телефона и интересующий товар. Менеджер перезвонит и согласует наличие, цену и условия доставки.',
    },
  },
  {
    uz: {
      q: 'Narxlar saytda nima uchun ko‘rsatilmagan?',
      a: 'Narx buyurtma hajmiga, mahsulot modeliga va qadoqlash shartlariga bog‘liq. Zayafka qoldirsangiz, menejer aniq hisob-kitobni aytadi — bu sizga ortiqcha to‘lov qilmaslikka yordam beradi.',
    },
    ru: {
      q: 'Почему цены не указаны на сайте?',
      a: 'Цена зависит от объёма заказа, модели и условий упаковки. Оставьте заявку — менеджер сделает точный расчёт, чтобы вы не переплачивали.',
    },
  },
  {
    uz: {
      q: 'Yetkazib berish qanday amalga oshiriladi?',
      a: 'Toshkent shahri bo‘ylab yetkazib berish 1 ish kuni ichida amalga oshiriladi. Viloyatlarga pochta va yuk tashish xizmatlari orqali 1–3 ish kuni ichida yuboramiz; aniq muddat manzilga bog‘liq.',
    },
    ru: {
      q: 'Как осуществляется доставка?',
      a: 'По городу Ташкенту доставка занимает 1 рабочий день. В регионы отправляем почтой и транспортными компаниями за 1–3 рабочих дня; точный срок зависит от адреса.',
    },
  },
  {
    uz: {
      q: 'Ulgurji xaridorlar uchun shartlar bormi?',
      a: 'Ha. Katta hajmdagi buyurtmalar uchun narx hajmga qarab alohida kelishiladi, shartnoma va hisob-faktura asosida ishlaymiz. Shartlarni menejer bilan aniqlashtirsangiz bo‘ladi.',
    },
    ru: {
      q: 'Есть ли условия для оптовых покупателей?',
      a: 'Да. Для крупных объёмов цена согласуется индивидуально и зависит от объёма; работаем по договору и счёту-фактуре. Условия уточняйте у менеджера.',
    },
  },
  {
    uz: {
      q: 'Namuna yoki maslahat olish mumkinmi?',
      a: 'Ha, menejer bilan bog‘lanib mahsulot tafsilotlari, material va qo‘llash bo‘yicha maslahat olishingiz mumkin. Kerak bo‘lsa, qaysi model sizning loyihangizga mos kelishini birgalikda tanlaymiz.',
    },
    ru: {
      q: 'Можно ли получить консультацию или образец?',
      a: 'Да, свяжитесь с менеджером: подскажем детали, материал и особенности применения. При необходимости вместе подберём модель под ваш проект.',
    },
  },
];
