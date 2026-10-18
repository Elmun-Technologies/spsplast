# Fonni olib tashlash — qolip va plitka rasmlari (2026-10-18)

Skript: `scripts/extract/remove_bg_2027.py` (`npm run images:bg`), umumiy kod
`scripts/extract/cutout_2027.py`, niqoblar `media-src/clean/*.png` + `manifest.json`.
Hammasi mahalliy: rembg 2.0.85 + onnxruntime, model `isnet-general-use` (GitHub release'dan).
Hech bir rasm tashqi xizmatga yuborilmagan.

## Natija

| | soni |
|---|---|
| Ishlov berildi (`*-mold-*`, `*-tile-*`) | **89** (67 qolip + 22 plitka) |
| ok — rembg `isnet-general-use` | **67** (45 zavod qolipi + 22 plitka) |
| fallback — rang kaliti (`max(RGB) < 110` va `B ≥ R`) | **22** (2026 studiya qoliplari, sariq taxta fonida) |
| asl rasm qoldirildi | **0** |
| Tegilmagan: `*-scene*.webp` (44), `public/images/site` | — |

Chiqish formati: shaffof WebP (alfa), obyekt chegarasiga kesilgan, 800×800 kvadrat
markazida ~7% chekka, sifat 82 (`alpha-quality` 90), alfa 1px qisqartirilgan + 0.6px
yumshatilgan (halo yo'q). Qolip ichidagi relyef "teshiklari" to'ldiriladi (fon emas).

## Usullar va sabablar

- **isnet-general-use** — zavod suratlari (oq/kulrang fon, qora va oq qoliplar) va kulrang
  plitkalar: hammasi toza. Oq qoliplar oq fonda (`dekor-sokol`, `dekor-zina-30-120-gladkiy`,
  `fasad-rus-2`, `fasad-rus-2-2`, `trotuar-22-uzor-50-25`, `fasad-beeline-3`) — to'q fonda
  tekshirildi, chegaralar to'g'ri.
- **Rang kaliti (22 ta 2026 studiya qolipi)** — isnet sariq taxtani ham obyekt deb oldi
  (birinchi o'tishda 22 tasida sariq fon qolgan edi). To'q ko'k qolip yorqinlik + rang bo'yicha
  ajratildi, sariq ustidagi jigarrang soya `B ≥ R` sharti bilan chiqarildi, chet Gauss bilan
  silliqlandi.
- **Plitkalar** — teshik to'ldirish o'chirilgan, deyarli oq piksellar (`min(RGB) > 232`) fon:
  juft plitkalar orasidagi oq tirqish (`trotuar-64-royal-2-tile-a`) shu bilan ketdi;
  `trotuar-bumerang-tile-a` uchun chegara 212 (`OVERRIDES`).

## Fayl bo'yicha qaydlar (kichik, rasm saytda ishlatiladi)

| Fayl | Qayd |
|---|---|
| 22 ta 2026 studiya qolipi (`trotuar-01-monako`, `-03-yalta`, `-05-magna`, `-06-azara`, `-07-parus`, `-09-versache-1`, `-12-rio`, `-14-shersha`, `-15-floriya`, `-19-eksklyuziv`, `-26-astana`, `-27-yulduz`, `-28-turkman-guli`, `-38-rombik-yangi`, `-50-azaliya-1`, `-56-buxoro`, `-57-afina`, `-58-rokki`, `-64-royal-2`, `-79-palma`, `-81-vindovs`, `trotuar-bumerang`) | Manba kichik (~250–300 px obyekt, 900 px JPG) → 800 px ga ~2.5x kattalashgan, biroz yumshoq; chetida mayda notekisliklar (`-19-eksklyuziv`, `-06-azara` — soya qoldig'i). Yaxshi sifat uchun render/yangi surat kerak (`docs/data-questions.md`). |
| 22 ta plitka (`*-tile-a`) | Manba juda kichik (~180 px) → chet biroz yumshoq. Fon toza. |
| `trotuar-50-azaliya-1`, `-56-buxoro`, `-57-afina`, `-64-royal-2`, `-79-palma` (qolip) | Manbada ikki alohida surat yonma-yon — ikki bo'lak kanvasda kichik va bir-biridan uzoq. |
| `trotuar-56-buxoro-tile-a`, `-57-afina-tile-a` | Avtomatik qayd "obyekt juda kichik" (manbada 1.7–1.9% maydon) — natija vizual tekshirildi, to'g'ri. |
| `trotuar-02-ornament`, `-11-setka`, `-34-parket-20-20`, `-66-aleya-2`, `-71-mumtoz` (qolip) | rembg relyefning bir qismini fon deb olgan — ichki teshiklar to'ldirildi (15–42%), natija to'g'ri. |
| `trotuar-41-dubay-yaltiroq-mold-a` | Osish teshigi (yuqorida) to'ldirilgan, ichida oq fon ko'rinadi — sezilmas darajada. |
| `trotuar-13-viking-mold-a` | Yuqori o'ng burchakda manbadagi jigarrang dog' (fon emas, suratning o'zida). |

## Kontakt varaqlari

`npm run images:bg -- --compose --sheets` → `docs/audits/bg-removal/`
(`molds_before.jpg`, `molds_ck.jpg` shaxmat fonda, `molds_wh.jpg` oq fonda; `tiles_*` xuddi shunday).
JPG'lar gitignored — qayta yasaladi.

## Sayt

Kartochkadagi qolip miniatyurasi (`.sps-card__mold`: oq `--surface` quti, `object-fit: contain`)
va model galereyasi (`.stage` / `.th button.contain`: `--surface-alt` fon, `contain`) shaffof
rasmlar bilan to'g'ri ko'rinadi — CSS o'zgartirilmadi.

## Repo hajmi

- `media-src/clean/` (89 niqob + manifest): ~0.8 MB
- `media-src/studio-2026/` (44 ta arxiv JPG, git tarixidan tiklangan): ~0.8 MB
- `public/catalog/2027` qolip/plitka WebP: 1.1 MB → 2.95 MB (+1.85 MB; avval 2026 rasmlari
  asosan bo'sh oq maydon edi)
