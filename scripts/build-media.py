#!/usr/bin/env python3
"""
SPS media kutubxonasi generatori.

Ildizdagi katta master fayllardan (169 ta `Изображение…png`, 116 ta `DSC…jpg`)
sayt uchun kerakli, optimallashtirilgan nusxalarni yasaydi:

  public/media/blog/<slug>.jpg          — blog muqovalari (1600×900)
  public/media/projects/<n>-before.jpg  — loyiha "oldin" (muhit, 900×900)
  public/media/projects/<n>-after.jpg   — loyiha "keyin" (beton mahsulot, 900×900)
  public/media/production/<nom>.jpg     — ishlab chiqarish galereyasi (1200×900)

Manba master fayllar o'z joyida qoladi — bu skript faqat nusxa yasaydi
(idempotent: qayta ishga tushirsa xuddi shu natijani beradi).

Ishlatish:
    python3 scripts/build-media.py            # hammasi
    python3 scripts/build-media.py --list     # faqat rejani ko'rsatadi
"""

import argparse
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

IM_LIMITS = ['-limit', 'memory', '512MiB', '-limit', 'map', '1GiB']


# Manba master fayllar `media-src/` da: 169 ta katta PNG `media-src/masters/`
# (git'ga kirmaydi, faqat diskda), studiya/zavod suratlari `studio|factory`.
# Skript barcha joylarni qidiradi, shuning uchun fayl ko'chirilgan bo'lsa ham
# ishlaydi.
MASTER_DIRS = [
    'media-src/masters',
    'media-src/studio',
    'media-src/factory',
    'media-src/pdf',
    '',
]


def src(name: str) -> str:
    """Master faylning to'liq yo'li (nomlar kirillcha bo'lishi mumkin)."""
    for d in MASTER_DIRS:
        candidate = os.path.join(ROOT, d, name) if d else os.path.join(ROOT, name)
        if os.path.exists(candidate):
            return candidate
    return os.path.join(ROOT, name)


def run(args):
    subprocess.run(args, check=True)


def cover(source: str, out: str, size: str = '1600x900', quality: int = 80):
    """Yagona muqova: markazdan kesib, kerakli nisbatga keltiradi."""
    os.makedirs(os.path.dirname(out), exist_ok=True)
    w, h = size.split('x')
    run(['convert', *IM_LIMITS, source,
         '-resize', f'{w}x{h}^', '-gravity', 'center', '-extent', size,
         '-strip', '-interlace', 'Plane', '-quality', str(quality), out])


def split_pair(source: str, before_out: str, after_out: str, size: str = '900x900', quality: int = 80):
    """
    Juftlashgan PNG (chapda muhit, o'ngda mahsulot) ni ikki qismga bo'ladi.

    Katalogdagi studiya kolleksiyasi shu formatda: bitta kadrda "qolip/qoplama
    qo'llangan joy" va "tayyor beton mahsulot" yonma-yon turadi. Loyihalar
    sahifasidagi "oldin/keyin" ko'rsatkichi aynan shu ikki yarmidan yasaladi.
    """
    os.makedirs(os.path.dirname(before_out), exist_ok=True)
    w, h = size.split('x')
    # chap yarmi (muhit) va o'ng yarmi (mahsulot)
    run(['convert', *IM_LIMITS, source, '-gravity', 'West', '-crop', '50%x100%+0+0', '+repage',
         '-resize', f'{w}x{h}^', '-gravity', 'center', '-extent', size,
         '-strip', '-interlace', 'Plane', '-quality', str(quality), before_out])
    run(['convert', *IM_LIMITS, source, '-gravity', 'East', '-crop', '50%x100%+0+0', '+repage',
         '-resize', f'{w}x{h}^', '-gravity', 'center', '-extent', size,
         '-strip', '-interlace', 'Plane', '-quality', str(quality), after_out])


# ---------------------------------------------------------------------------
# 1. BLOG MUQOVALARI — har bir maqola uchun mavzuga mos sahna
# ---------------------------------------------------------------------------
BLOG = [
    ('bruschatka-sexini-noldan-boshlash', 'Изображение ChatGPT 26 сент. 2026 г., 09_50_00-3.png'),
    ('qolip-resursini-oshirish', 'Изображение ChatGPT 26 сент. 2026 г., 09_49_42-1.png'),
    ('devor-paneli-fasad-narxi-2026', 'Изображение ChatGPT 26 сент. 2026 г., 09_50_15-21.png'),
    ('dekorativ-qoliplar-bilan-hovli', 'Изображение ChatGPT 26 сент. 2026 г., 09_50_11-16.png'),
    ('polipropilen-yoki-abs', 'Изображение ChatGPT 26 сент. 2026 г., 09_51_48-25.png'),
    ('beton-quyishda-5-xato', 'Изображение ChatGPT 26 сент. 2026 г., 09_50_01-5.png'),
    ('trotuar-plitka-ornatish', 'Изображение ChatGPT 26 сент. 2026 г., 09_51_43-19.png'),
]

# ---------------------------------------------------------------------------
# 2. LOYIHALAR — "oldin/keyin" juftliklari
# ---------------------------------------------------------------------------
PROJECTS = [
    ('1-xususiy-hovli-toshkent', 'Изображение ChatGPT 26 сент. 2026 г., 09_50_03-7.png'),
    ('2-devor-panellari-maxalla', 'Изображение ChatGPT 26 сент. 2026 г., 09_51_28-1.png'),
    ('3-bog-dekor-skameykalar', 'Изображение ChatGPT 26 сент. 2026 г., 09_50_08-13.png'),
    ('4-kafe-hovlisi-mosaic', 'Изображение ChatGPT 26 сент. 2026 г., 09_52_31-1.png'),
    ('5-naqshli-trotuar-plita', 'Изображение ChatGPT 26 сент. 2026 г., 09_51_35-10.png'),
    ('6-3d-fasad-panellari', 'Изображение ChatGPT 26 сент. 2026 г., 09_50_28-35.png'),
]

# ---------------------------------------------------------------------------
# 3. ISHLAB CHIQARISH GALEREYASI — studiya suratlari va zavod kadrlari
# ---------------------------------------------------------------------------
PRODUCTION = [
    ('qolip-stone-panel', 'Isolate_white_plastic_stone_mold_20260927203131.jpg'),
    ('qolip-brick-panel', 'Isolate_white_plastic_brick_mold_20260927203144.jpg'),
    ('qolip-decorative-panel', 'Isolate_white_plastic_decorative…_20260927203150.jpg'),
    ('qolip-textured-panel', 'Isolate_white_textured_panel_20260927203141.jpg'),
    ('qolip-concrete-1', 'Isolate_white_plastic_concrete_mold_20260927203120.jpg'),
    ('qolip-concrete-2', 'Isolate_white_plastic_concrete_mold_20260927203135.jpg'),
    ('naqsh-devor-paneli', 'DSC03107.JPG_20260927203239.jpg'),
    ('naqsh-ornament-plita', 'DSC03326.JPG_20260927202453.jpg'),
    ('naqsh-plita-burchak', 'DSC03163.JPG_20260927202820.jpg'),
    ('naqsh-dekorativ-plita', 'DSC03354.JPG_20260927202307.jpg'),
]


def plan():
    items = []
    for slug, source in BLOG:
        items.append((source, os.path.join(ROOT, 'public/media/blog', f'{slug}.jpg'), 'cover'))
    for slug, source in PROJECTS:
        # Bitta yozuv — skript o'zi "oldin" va "keyin" yarmlarini yasaydi.
        items.append((source, os.path.join(ROOT, 'public/media/projects', slug), 'split'))
    for name, source in PRODUCTION:
        items.append((source, os.path.join(ROOT, 'public/media/production', f'{name}.jpg'), 'photo'))
    return items


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--list', action='store_true', help='faqat rejani ko‘rsatish')
    args = parser.parse_args()

    missing = []
    for source, out, kind in plan():
        if not os.path.exists(src(source)):
            missing.append(source)
    if missing:
        print('!! Manba fayllar topilmadi:')
        for m in missing:
            print('   ', m)
        sys.exit(1)

    if args.list:
        for source, out, kind in plan():
            print(f'{kind:6} {os.path.relpath(out, ROOT):55} <- {source}')
        print(f'\nJami: {len(plan())} fayl')
        return

    for source, out, kind in plan():
        if kind == 'split':
            before, after = f'{out}-before.jpg', f'{out}-after.jpg'
            split_pair(src(source), before, after)
            print(f'  ✓ {os.path.relpath(before, ROOT)} + {os.path.relpath(after, ROOT)}')
        elif kind == 'photo':
            cover(src(source), out, size='1200x900')
            print(f'  ✓ {os.path.relpath(out, ROOT)}')
        else:
            cover(src(source), out)
            print(f'  ✓ {os.path.relpath(out, ROOT)}')

    print('\nTayyor.')


if __name__ == '__main__':
    main()
