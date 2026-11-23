/**
 * Xato sahifasi matnlari (`[lang]/error.tsx`) — alohida modul (2026-11-23): error boundary mijoz komponenti va
 * har sahifaga yuklanadi; butun `pages/{uz,ru,en}.ts` ni import qilsa, uch tilning barcha sahifa matnlari
 * (~17 KB gzip) har sahifa JS'iga tushardi. `pages/<til>.ts` ham shu obyektlarni ishlatadi (`pages.error.*`).
 */
export const errorUz = {
  title: 'Texnik xatolik',
  text: "Sahifa yuklanmadi. Qayta urinib ko‘ring yoki biz bilan bog‘laning — zayafka qoldirishda yordam beramiz.",
  retry: 'Qayta yuklash',
  home: 'Bosh sahifa',
  catalog: 'Katalogni ochish',
  call: 'Menejer bilan bog‘lanish',
  loading: 'Yuklanmoqda',
};

export const errorRu = {
  title: 'Техническая ошибка',
  text: 'Страница не загрузилась. Попробуйте ещё раз или свяжитесь с нами — оформим заявку вместе.',
  retry: 'Загрузить снова',
  home: 'Главная',
  catalog: 'Открыть каталог',
  call: 'Связаться с менеджером',
  loading: 'Загрузка',
};

export const errorEn = {
  title: 'Something went wrong',
  text: 'The page failed to load. Try again, or contact us and we will submit the request together.',
  retry: 'Reload',
  home: 'Home page',
  catalog: 'Open catalog',
  call: 'Contact a manager',
  loading: 'Loading',
};
