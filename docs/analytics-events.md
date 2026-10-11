# Analitika voqealari (redesign 2027)

Manba: `docs/design-handoff/HANDOFF.md` 5-bo'lim. Uchta asosiy konversiya
voqeasi majburiy: `generate_lead`, `add_to_request`, `add_to_compare`.

Skriptlar **faqat env ID o'rnatilganda** yuklanadi
(`src/components/analytics/AnalyticsScripts.tsx`, `afterInteractive`):

| Env | Vendor |
|---|---|
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 (GTM bo'lmasa) |
| `NEXT_PUBLIC_YANDEX_METRICA_ID` | Yandex Metrica (`reachGoal`) |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel |

ID bo'lmasa sahifaga birorta tashqi skript qo'shilmaydi (tekshiruv:
`tests/analytics2027.test.js`).

## Voqealar jadvali

| Voqea | Qachon | Qayerda | Parametrlar |
|---|---|---|---|
| `generate_lead` | `/api/leads` muvaffaqiyatli javob berganda (uch xil forma: tez zayafka, ro'yxat, ulgurji) | `src/lib/leadSubmit.ts` | `lead_type` (quick/list/partners), `request_id` (SPS-YYMM-NNNN), `item_count`, `lang`, `delivered` |
| `lead_failed` | so'rov xato qaytarsa (rate limit, validatsiya, tarmoq) | `src/lib/leadSubmit.ts` | `lead_type`, `error` |
| `add_to_request` | model "Zayafka ro'yxati"ga qo'shilganda | `src/lib/store/spsLists.ts` | `item_id` (slug), `item_code`, `item_name` |
| `remove_from_request` | ro'yxatdan olib tashlanganda | `src/lib/store/spsLists.ts` | `item_id` |
| `add_to_compare` | solishtirishga belgilanganda (maks 4) | `src/lib/store/spsLists.ts` | `item_id`, `compare_size` |
| `remove_from_compare` | solishtirishdan olinganda | `src/lib/store/spsLists.ts` | `item_id`, `compare_size` |
| `view_item` | model sahifasi ochilda | `src/components/model2027/ModelClient.tsx` | `item_id`, `item_code`, `item_name`, `item_category` (bo'lim), `lang` |
| `view_item_list` | katalog/bosh sahifa bloki montaj bo'lganda | `src/components/catalog2027/CatalogClient.tsx` | `item_list_name`, `item_count`, `lang` |
| `search` | katalog qidiruvida (3+ belgi, 600 ms debounce, takrorlanmaydi) | `src/components/catalog2027/CatalogClient.tsx` | `search_term`, `result_count`, `lang` |

Har bir voqea avtomatik ravishda `timestamp`, `page_path`, `page_title`
maydonlarini oladi (`trackEvent`, `src/lib/analytics.ts`).

## GA4 / Metrica sozlash

1. GA4: `generate_lead` ni **key conversion** (sobiq goal) qilib belgilang;
   `add_to_request` va `add_to_compare` ni mikro-konversiya sifatida kuzating.
2. Yandex Metrica: `reachGoal` nomi = voqea nomi (`generate_lead`, …) —
   maqsadlarni shu nomlar bilan yarating.
3. Meta Pixel: `generate_lead` → standart `Lead` hodisasiga map qilingan.
4. Narx saytda yo'q, shuning uchun `value`/`currency` yuborilmaydi —
   konversiya qiymati menejer hisob-kitobidan keyin CRM'da aniqlanadi.
