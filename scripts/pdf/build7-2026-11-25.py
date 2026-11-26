import pikepdf, re, subprocess, sys
from pikepdf import Name
LS = 0.0
F = 'node_modules/@fontsource/inter/files'
VAR = sys.argv[1]; DEL = 38      # eski 38-bet = Kaliforniya (bir xil qolip) — olib tashlanadi
IN = {'max': '/home/claude/outputs/SPS_katalog_2026_MAX.pdf', 'web': '/tmp/pdfw/orig.pdf'}[VAR]
pdf = pikepdf.open(IN); assert len(pdf.pages) == 128
# 1) Girih rasmlari (obyekt raqami emas, bet tuzilmasi bo'yicha)
_pg = pdf.pages[6]
_scene = [v for k, v in _pg.Resources.XObject.items() if v.get('/Subtype') == '/Image']; assert len(_scene) == 1
_top = [v for k, v in _pg.Resources.XObject.items() if v.get('/Subtype') == '/Form'][0]
_mold = []
for k, v in _top.Resources.XObject.items():
    if v.get('/Subtype') == '/Form' and '/Resources' in v:
        for k2, v2 in v.Resources.get('/XObject', {}).items():
            if v2.get('/Subtype') == '/Image' and int(v2.Width) > 1000: _mold.append(v2)
assert len(_mold) == 1, len(_mold)
for o, f, w, h in ((_mold[0], 'girih_mold.jpg', 1100, 979), (_scene[0], 'girih_scene.jpg', 1170, 1650)):
    print('girih', o.objgen, o.Width, o.Height, '->', w, h)
    o.write(open(f, 'rb').read(), filter=Name.DCTDecode); o.Width, o.Height = w, h
    for k in ('/ColorTransform', '/DecodeParms', '/SMask'):
        if k in o: del o[k]
# 2) eski model raqami va bet raqamini kontent oqimidan olib tashlash (20..124-betlar)
BLOCK = re.compile(rb'BT\s(?:(?!ET\b).)*?\sET', re.S)
def info(b):
    tf = re.search(rb'/F\d+ ([\d.]+) Tf', b); g = re.findall(rb'<([0-9A-F]{4})>', b)
    return (tf.group(1).decode() if tf else None), [x.decode() for x in g]
digit = {}
jobs = []
for idx in range(19, 124):
    pg = pdf.pages[idx]; p = idx + 1
    hit = None
    for k, f in pg.Resources.XObject.items():
        if f.get('/Subtype') != '/Form': continue
        c = f.read_bytes()
        foot = [m for m in BLOCK.finditer(c) if info(m.group(0))[0] == '6' and len(info(m.group(0))[1]) == 3]
        num = [m for m in BLOCK.finditer(c) if info(m.group(0))[0] == '26.66' and len(info(m.group(0))[1]) == 3]
        if len(foot) == 1 and len(num) == 1: hit = (f, c, foot[0], num[0])
    assert hit, f'bet {p}: bloklar topilmadi'
    f, c, fm, nm = hit
    for ch, gid in zip(f'{p:03d}', info(fm.group(0))[1]):       # bet raqamidan glif -> raqam xaritasi
        assert digit.setdefault(gid, ch) == ch, (p, gid, ch, digit)
    jobs.append((idx, f, c, fm, nm))
for idx, f, c, fm, nm in jobs:
    p = idx + 1
    old = ''.join(digit[g] for g in info(nm.group(0))[1])
    assert old == f'{p - 4:03d}', (p, old)                      # 20-bet = №016
    a, b = sorted([fm.span(), nm.span()])
    f.write(c[:a[0]] + c[a[1]:b[0]] + c[b[1]:])
print('tozalandi', len(jobs), 'bet; glif xaritasi', dict(sorted(digit.items())))
# 3) yangi raqamlar (shaffof qatlam)
faces = ''.join(f"@font-face{{font-family:Inter;font-weight:{w};src:url({F}/inter-latin-{w}-normal.woff2) format('woff2')}}" for w in (500, 800))
OFF = lambda p: 2 if p < DEL else 1
secs = ''.join(f'<section><b>{p - 4 + OFF(p):03d}</b><i>{p + OFF(p):03d}</i></section>' for p in range(20, 125) if p != DEL)
open('foot.html', 'w').write(f'''<!doctype html><meta charset="utf-8"><style>{faces}
@page{{size:595.28pt 419.53pt;margin:0}}*{{margin:0;padding:0}}
section{{position:relative;width:595.28pt;height:419.53pt;page-break-after:always;overflow:hidden}}
b{{position:absolute;right:calc(595.28pt - 278.34pt - {LS}pt);top:12.116pt;font:800 20pt/24.166pt Inter;letter-spacing:{LS}pt;color:#fff;white-space:nowrap}}
i{{position:absolute;right:calc(595.28pt - 274.2pt - .9pt);top:407.97pt;font:normal 500 4.5pt/5.439pt Inter;letter-spacing:.9pt;color:rgb(179,173,165);white-space:nowrap}}
</style>{secs}''')
subprocess.run(['node', 'topdf2.mjs'], check=True)
ov = pikepdf.open('foot.pdf'); assert len(ov.pages) == 104
for k, (idx, *_r) in enumerate([j for j in jobs if j[0] != DEL - 1]):
    pg = pdf.pages[idx]
    pg.add_overlay(ov.pages[k], pikepdf.Rectangle(0, 419.53 - 420, 594.96, 419.53))   # masshtabsiz, yuqori chetdan
del pdf.pages[DEL - 1]
# 4) Terratsso — novinkalar oxiri (19-bet), №016
subprocess.run(['node', 'topdf.mjs'], check=True)
t = pikepdf.open('terr.pdf'); tp = t.pages[0]
tp.MediaBox = [0, 0.47, 594.96, 420]; tp.CropBox = [0, 0.47, 594.96, 420]
pdf.pages.insert(18, tp)
pdf.pages.insert(18, pdf.pages[18])   # ikkinchi o'rinbosar (016 va 017 nv.py da qayta teriladi)
pdf.save(f'tmp3_{VAR}.pdf', linearize=False, object_stream_mode=pikepdf.ObjectStreamMode.generate)
pdf.close()
print('betlar', len(pdf.pages))

# ================= 2-qism =================
import json, os, cv2
FIN = '/tmp/scn/final/'
def S_(name): return f'{FIN}{name}_{VAR}.jpg'
items = json.load(open('/home/claude/cat2/items6.json'))
def page_of(k): return k + 6 if k < 34 else k + 5          # k = items6 dagi tartib raqami (1 dan); 34 = olib tashlangan
ID2K = {}
for k, e in enumerate(items, 1):
    m = re.search(r'/3d/(t\d+)/', e.get('qr', ''))
    if m: ID2K[m.group(1)] = k
SCENES = {}
for tid in ['t08', 't11', 't49', 't85']:   # 2026-11-25: t54 t57-t61 t63, Аллея t34 t71 t89 t73, Кабанчик t75, Николай t79 egasi so'rovi bilan asl holatida
    if os.path.exists(S_(tid)): SCENES[page_of(ID2K[tid]) - 1] = S_(tid)
    else: print('YO\'Q', tid)
for idx, nm in ((3, 'nv_antara'), (5, 'nv_nat1'), (6, 'nv_nat2'), (10, 'nv_labirint')):   # Antara: izlar qo'shni plitkada to'g'ri davom etadi (egasi tasdiqladi 2026-11-25)
    if os.path.exists(S_(nm)): SCENES[idx] = S_(nm)
    else: print('YO\'Q', nm)
# 2026-11-25 kechki: egasi bergan yangi terilgan rasmlar (asl sifat, /tmp/nw/<tid>_<web|max>.jpg) — bet = katalog beti
NEWSC = {'t34': 91, 't71': 92, 't89': 93, 't57': 98, 't58': 99, 't59': 100, 't61': 102, 't62': 103, 't63': 104, 't68': 105, 't83': 111, 't84': 112}
for tid, pgno in NEWSC.items():
    pth = f'/tmp/nw/{tid}_{VAR}.jpg'
    assert os.path.exists(pth), pth
    assert page_of(ID2K[tid]) == pgno, (tid, page_of(ID2K[tid]), pgno)
    SCENES[pgno - 1] = pth
# 2026-11-26: egasining ZIP'i (Qolip_va_terim_13_model) — terilgan rasmlar, /tmp/nw2/<kalit>_<web|max>.jpg, kalit -> katalog beti
NEWSC2 = {'t08': 29, 't10': 32, 'versal': 44, 'charogon-1': 45, 'charogon-2': 46, 't49': 60, 'ornament-18-36': 62, 't30': 74, 't31': 75,
          'tomir-15-15': 79, 'bodom-15-15': 80, 't74': 81, 't75': 84}
for key, pgno in NEWSC2.items():
    pth = f'/tmp/nw2/{key}_{VAR}.jpg'; assert os.path.exists(pth), pth
    if key in ID2K: assert page_of(ID2K[key]) == pgno, (key, page_of(ID2K[key]), pgno)
    SCENES[pgno - 1] = pth
# 2026-11-26 (3-to'plam): egasining yana 7 ta terilgan rasmi, /tmp/nw3/<tid>_<web|max>.jpg (t42 — avvalgi rasm o'rniga "New diamond")
NEWSC3 = {'t41': 115, 't42': 116, 't53': 96, 't54': 97, 't69': 106, 't81': 109, 't104': 118}
for tid, pgno in NEWSC3.items():
    pth = f'/tmp/nw3/{tid}_{VAR}.jpg'; assert os.path.exists(pth), pth
    assert page_of(ID2K[tid]) == pgno, (tid, page_of(ID2K[tid]), pgno)
    SCENES[pgno - 1] = pth
SCN = {'bordA': S_('bordA') if os.path.exists(S_('bordA')) else 'bord_scene_A.jpg', 'bordB': S_('bordB') if os.path.exists(S_('bordB')) else 'bord_scene_B.jpg'}
def kpage(title, sub): return [page_of(k) - 1 for k, e in enumerate(items, 1) if e['title'] == title and (e.get('sub') or '') == sub][0]
CATPAGES = {kpage('ТОМИР', '20×20'): 'ТОМИР 1', kpage('ТОМИР', '20×20 Х1'): 'ТОМИР 2', kpage('ТОМИР', '20×20 Х2'): 'ТОМИР 3', kpage('ТОМИР', '15×15'): 'ТОМИР 4',
            kpage('БОДОМ', '20×20 Х2'): 'БОДОМ 1', kpage('БОДОМ', '20×20 Х4'): 'БОДОМ 2', kpage('БОДОМ', '15×15'): 'БОДОМ 3',
            kpage('ШЕРША', '30×30'): 'ШЕРША 1', kpage('ШЕРША', '15×15'): 'ШЕРША 2'}
print('nom o\'zgaradigan betlar', {k + 1: v for k, v in CATPAGES.items()})
PW, PH = 793.28, 560.0            # Chromium sahifasi (px) = 594.96 x 420 pt; asl PDF shuni 1.000538 x 0.998881 ga cho'zgan
SX, SY = 1.00053792, 0.99888095
INK, LAB, HLAB = '#17171a', '#8c8781', '#5d5a56'
def T(x, base, fs, wt, ls, color, text, cls='t', extra=''):
    return f'<div class="{cls}" style="left:{x}px;top:{base - 0.86378 * fs:.3f}px;font:{wt} {fs}px/{fs}px Inter;letter-spacing:{ls}px;color:{color};{extra}">{text}</div>'
def line(x, y, w, op): return f'<div class="ln" style="left:{x}px;top:{y}px;width:{w}px;opacity:{op}"></div>'
def header(title, sub, color):
    h = T(34.02, 30, 15.33, 600, 1.992, '#fff', title)
    h += T(34.02, 47, 7.2, 700, 1.576, 'rgba(255,255,255,.88)', sub or '', 't sub')
    h += '<div class="bdg"></div>' + T(0, 47, 5.86, 800, 1.173, color, 'НОВИНКА', 't bdt')
    return f'<div class="hdr">{h}</div>'
def tab(text, color): return f'<div class="tab" style="background:{color}">{text}</div>'
def dims(x0, y0, w, h, wl, hl, color, yb=None):
    yb = y0 + h if yb is None else yb; yl, xl = yb + 12.02, x0 - 12.02
    s = f'<g stroke="{color}" stroke-width=".42"><path d="M{x0} {yb+.94}V{yb+14.66}M{x0+w} {yb+.94}V{yb+14.66}M{x0-1.89} {yl}H{x0+w+1.89}"/>'
    s += f'<path d="M{y0 and x0-.94} {y0}H{x0-14.66}M{x0-.94} {y0+h}H{x0-14.66}M{xl} {y0-1.89}V{y0+h+1.89}"/></g>'
    s += f'<g stroke="{color}" stroke-width="1.06"><path d="M{x0-1.89} {yl+1.89}L{x0+1.89} {yl-1.89}M{x0+w-1.89} {yl+1.89}L{x0+w+1.89} {yl-1.89}M{xl-1.89} {y0+1.89}L{xl+1.89} {y0-1.89}M{xl-1.89} {y0+h+1.89}L{xl+1.89} {y0+h-1.89}"/></g>'
    s += f'<g fill="{color}" font-family="Inter" font-weight="700" font-size="6.5" text-anchor="middle"><text x="{x0+w/2}" y="{yb+20.51}">{wl}</text><text transform="translate({x0-14.85} {y0+h/2}) rotate(-90)">{hl}</text></g>'
    return s
def sketch(shape, x0, y0, w, h, wl, hl, color, cells=(1, 1)):
    s = ''
    if shape == 'circle':
        cx, cy, r = x0 + w / 2, y0 + h / 2, w / 2
        s += f'<circle cx="{cx}" cy="{cy}" r="{r+4.83}" stroke="{INK}" stroke-width=".49"/><circle cx="{cx}" cy="{cy}" r="{r}" stroke="{INK}" stroke-width=".98"/>'
    elif shape == 'hex':
        P = lambda e: ' '.join(f'{x:.2f},{y:.2f}' for x, y in ((x0 + .2 * w - e * .55, y0 - e), (x0 + .8 * w + e * .55, y0 - e), (x0 + w + e * 1.15, y0 + h / 2), (x0 + .8 * w + e * .55, y0 + h + e), (x0 + .2 * w - e * .55, y0 + h + e), (x0 - e * 1.15, y0 + h / 2)))
        s += f'<polygon points="{P(4.83)}" stroke="{INK}" stroke-width=".49"/><polygon points="{P(0)}" stroke="{INK}" stroke-width=".98"/>'
    else:
        s += f'<rect x="{x0-4.83}" y="{y0-4.83}" width="{w+9.66}" height="{h+9.66}" stroke="{INK}" stroke-width=".49"/>'
        nx, ny = cells; g = 0 if (nx, ny) == (1, 1) else 3.2
        cw, chh = (w - g * (nx - 1)) / nx, (h - g * (ny - 1)) / ny
        for i in range(nx):
            for j in range(ny):
                s += f'<rect x="{x0+i*(cw+g):.2f}" y="{y0+j*(chh+g):.2f}" width="{cw:.2f}" height="{chh:.2f}" stroke="{INK}" stroke-width=".98"/>'
    if cells == (1, 1):
        s += f'<path d="M{x0+w/2} {y0+3}V{y0+h-3}M{x0+3} {y0+h/2}H{x0+w-3}" stroke="{INK}" stroke-width=".3" stroke-dasharray="5 1.6 1 1.6" opacity=".4"/>'
    return s + dims(x0, y0, w, h, wl, hl, color)
def svg(inner): return f'<svg class="sk" viewBox="0 0 397 560" width="397" height="560" fill="none">{inner}</svg>'
def body(b, color):
    o = ''
    if b.get('shape'):
        o += T(34.02, 430, 5.46, 600, 1.088, LAB, 'ЭСКИЗ · РАЗМЕР ПЛИТКИ, ММ')
        w, h = b['px']; x0, y0 = 59.24, 506.26 - h
        o += svg(sketch(b['shape'], x0, y0, w, h, b['wl'], b['hl'], color))
        o += T(35.14, 538, 5.46, 600, 0.214, HLAB, f"h {b['d']}")
    X = 34.02 if b.get('wide') else 161.09; XL = 34 if b.get('wide') else 161; WL = 333 if b.get('wide') else 206
    if b.get('kg'):
        y = 443
        o += line(XL, y, WL, .1608) + line(XL, y + 18, WL, .102) + line(XL, y + 38, WL, .1608)
        o += T(X, y + 13, 5.46, 600, 1.088, LAB, 'РАЗМЕР, ММ') + T(296.77, y + 13, 5.46, 600, 1.088, LAB, 'НА 1 М²')
        o += T(X, y + 29, 8.39, 600, -.01, INK, b['size']) + T(296.77, y + 29, 8.39, 600, -.01, INK, b['per'])
        o += T(X, y + 50, 5.46, 600, 1.088, LAB, 'ВЕС КОМПЛЕКТА ФОРМ НА 1 М²') + T(X, y + 63, 8.26, 600, 0, INK, b['kg'])
        o += T(X, y + 75, 5.46, 600, 1.088, LAB, 'МАТЕРИАЛ') + T(X, y + 88, 8.26, 600, 0, INK, 'Полипропилен · АБС')
    else:
        y = 454
        o += line(XL, y, WL, .1608) + line(XL, y + 19, WL, .102) + line(XL, y + 39, WL, .1608)
        o += T(X, y + 14, 5.46, 600, 1.088, LAB, 'РАЗМЕР, ММ') + T(X, y + 29, 8.39, 600, -.01, INK, b['size'])
        o += T(X, y + 50, 5.46, 600, 1.088, LAB, 'МАТЕРИАЛ') + T(X, y + 63, 8.26, 600, 0, INK, 'Полипропилен · АБС')
    return o
SQ = dict(shape='rect', px=(65.9, 65.9), wl='400', hl='400', d=50, size='400×400×50', per='6,25 шт')
PAGES = {
    3:  dict(title='АНТАРА', tab='АНТАРА', shrink=True, body=dict(shape='hex', px=(47.2, 72), wl='190', hl='290', d=45, size='290×190×45')),
    4:  dict(title='АНТАРА 2', tab='АНТАРА 2'),
    5:  dict(title='НАЦИОНАЛ 1', sub='КОМПЛЕКТ ИЗ 3 ФОРМ', tab='НАЦИОНАЛ 1'),
    6:  dict(title='НАЦИОНАЛ 2', sub='КОМПЛЕКТ ИЗ 3 ФОРМ', tab='НАЦИОНАЛ 2'),
    10: dict(title='ЛАБИРИНТ', sub='40×40', tab='ЛАБИРИНТ', body=dict(SQ, kg='6 500 г')),
    11: dict(title='ДОРОЖКА КРУГЛАЯ', sub='40×40', tab='ДОРОЖКА КРУГЛАЯ', body=dict(SQ, kg='6 000 г')),
    12: dict(title='ДОРОЖКА ПОЛОСА', sub='40×40', tab='ДОРОЖКА ПОЛОСА', body=dict(SQ, kg='6 000 г')),
    13: dict(body=dict(SQ, kg='6 900 г')),
    14: dict(title='ПАРКЕТ', sub='30×60', tab='ПАРКЕТ', body=dict(shape='rect', px=(88, 44), wl='600', hl='300', d=50, size='300×600×50', per='5,5 шт', kg='7 300 г')),
    15: dict(body=dict(shape='circle', px=(65.9, 65.9), wl='360', hl='360', d=30, size='360×360×30')),
    16: dict(title='КАДАМ', sub='ЛЕВЫЙ + ПРАВЫЙ', tab='КАДАМ', body=dict(wide=True, size='300×550×30')),
    17: dict(title='БОРДЮР ВЕРСАЧЕ', tab='БОРДЮР ВЕРСАЧЕ', shrink=True),
}
PAGES.update({i: dict(title=t, tab=t, cat=True) for i, t in CATPAGES.items()})
pdf = pikepdf.open(f'/tmp/pdfw/tmp3_{VAR}.pdf'); assert len(pdf.pages) == 129
def mc_fix(deleted):
    d = mn = 0
    for tok in re.findall(r'\bBDC\b|\bBMC\b|\bEMC\b', deleted):
        d += -1 if tok == 'EMC' else 1; mn = min(mn, d)
    return 'EMC\n' * (-mn) + '/NonStruct <</MCID 0 >>BDC\n' * (d - mn)
def qnet(s): return len(re.findall(r'(?m)^q$', s)) - len(re.findall(r'(?m)^Q$', s))
secs = []; order = []; FORMS = {}
for idx, cfg in PAGES.items():
    pg = pdf.pages[idx]
    form = max([v for k, v in pg.Resources.XObject.items() if v.get('/Subtype') == '/Form'], key=lambda v: len(v.read_bytes()))
    FORMS[idx] = form; c = form.read_bytes().decode('latin1')
    mh = re.search(r'(\.?\d[\d.]*) (\.?\d[\d.]*) (\.?\d[\d.]*) RG \1 \2 \3 rg\nEMC\n(/NonStruct <</MCID \d+ >>BDC\n)0 (\d+) 397 (61|64|82) re\nf\n', c); assert mh, idx
    rgb = [float(mh.group(i)) for i in (1, 2, 3)]; color = '#%02x%02x%02x' % tuple(round(v * 255) for v in rgb)
    cm = re.search(r'q\n(3\.125 0 0 3\.125 0 -?\d+ cm)\n', c).group(1)
    sec = ''
    # --- tana (eskiz + jadval) ---
    if cfg.get('body'):
        bg = re.search(r'0 \d+ 397 559 re\nf\n', c); b = mh.start(4)
        colset = f'{mh.group(1)} {mh.group(2)} {mh.group(3)} RG {mh.group(1)} {mh.group(2)} {mh.group(3)} rg\n/G3 gs\n'
        if c[bg.end():bg.end() + 2] == 'Q\n':          # fon naqshi bor: tana alohida q ichida
            a = re.search(r'EMC\n/X\d+ Do\n', c).end(); dele = c[a:b]; assert qnet(dele) == 1, (idx, qnet(dele))
            c = c[:a] + f'q\n{cm}\n' + colset + mc_fix(dele) + c[b:]
        else:                                          # fon naqshsiz: hammasi bitta q ichida
            a = bg.end(); dele = c[a:b]; assert qnet(dele) == 0, (idx, qnet(dele))
            c = c[:a] + colset + mc_fix(dele) + c[b:]
        sec += body(cfg['body'], color)
    # --- sarlavha ---
    if cfg.get('cat'):
        c, n = re.subn(r'BT\n/F\d+ 15\.3299999 Tf\n.*?ET\n', '', c, count=1, flags=re.S); assert n == 1, (idx, 'cat title')
        sec += T(34.02, 30, 15.33, 600, 1.992, '#fff', cfg['title'])
    elif cfg.get('title'):
        mn_ = re.search(r'BT\n/F\d+ 26\.66 Tf\n', c); n0 = mn_.start()
        starts = [m for m in re.finditer(r'q\n0 0 1240\.625 [\d.]+ re\nW\* n\n(q\n3\.125 0 0 3\.125 0 -?\d+ cm\n1 1 1 RG 1 1 1 rg\n/G3 gs\nEMC\n)', c) if m.start() < n0]
        s0 = starts[-1].start(1); dele = c[s0:n0]; assert qnet(dele) == 1, (idx, 'hdr', qnet(dele))
        assert '15.3299999 Tf' in dele and '5.8600001 Tf' in dele, idx
        c = c[:s0] + f'q\n{cm}\n1 1 1 RG 1 1 1 rg\n/G3 gs\n' + mc_fix(dele) + c[n0:]
        sec += header(cfg['title'], cfg.get('sub'), color)
        if cfg.get('shrink'):
            y0 = int(mh.group(5)); assert mh.group(6) == '82'
            c = c.replace(f'0 {y0} 397 82 re', f'0 {y0} 397 64 re'); assert c.count('0 0 1240.625 256.25 re') == 2
            c = c.replace('0 0 1240.625 256.25 re', '0 0 1240.625 200 re')
            c, n = re.subn(r'(BT\n/F\d+ 26\.66 Tf\n1 0 0 -1 [\d.]+ )(\d+)( Tm)', lambda m: f'{m.group(1)}{int(m.group(2)) - 9}{m.group(3)}', c); assert n == 1
            c, n = re.subn(r'(q\n1 0 0 1 \d+ )93( cm\n/G\d+ gs\nEMC\n/X\d+ Do)', r'\g<1>68\2', c); assert n == 1, (idx, 'logo')
            c, n = re.subn(r'(q\n1 0 0 1 \d+ )137( cm\n/G\d+ gs\n/X\d+ Do)', r'\g<1>109\2', c); assert n == 1, (idx, 'no')
    form.write(c.encode('latin1'))
    # --- o'ng tomondagi yorliq ---
    if cfg.get('tab'):
        pc = pg.Contents.read_bytes().decode('latin1')
        pc2, n = re.subn(r'397 \d+ [\d.]+ 18 re\nf\n', '', pc); assert n == 1, (idx, 'tab rect')
        pc2, n = re.subn(r'BT\n/F\d+ 6 Tf\n.*?ET\n', '', pc2, flags=re.S); assert n == 1, (idx, 'tab text')
        pg.Contents = pdf.make_stream(pc2.encode('latin1'))
        sec += tab(cfg['tab'], color)
    secs.append(f'<section>{sec}</section>'); order.append(idx)
# ---------- to'liq qayta teriladigan betlar ----------
def full(color, bg, title, sub, num, foot, mid, scene, tabtext):
    t = f'<div class="lbg" style="background:{bg}"></div><div class="hbg" style="background:{color}"></div>'
    t += T(34.02, 30, 15.33, 600, 1.992, '#fff', title) + f'<div class="hdr">{T(34.02, 47, 7.2, 700, 1.576, "rgba(255,255,255,.88)", sub, "t sub")}<div class="bdg"></div>{T(0, 47, 5.86, 800, 1.173, color, "НОВИНКА", "t bdt")}</div>'
    t += '<img class="logo" src="logo.png">' + T(304.33, 43, 8, 700, 0, 'rgba(255,255,255,.75)', '№') + f'<div class="t num" style="top:{43 - 0.86378 * 26.66:.3f}px">{num}</div>'
    t += mid + T(351.7, 551, 6, 400, 1.2, '#b3ada5', foot)
    t += f'<img class="scene" src="{scene}">' + tab(tabtext, color)
    return f'<section class="full">{t}</section>'
# №016 Bordyur Versache setka
GC = '#55704b'
m = '<img src="moldA_cut.png" style="position:absolute;left:135.7px;top:93px;height:314px;filter:drop-shadow(0 11px 10px rgba(20,22,26,.30)) drop-shadow(0 2px 2.5px rgba(20,22,26,.22))">'
m += T(34.02, 430, 5.46, 600, 1.088, LAB, 'ЭСКИЗ · РАЗМЕР ПЛИТКИ, ММ')
m += svg(f'<rect x="36" y="438" width="25" height="104" stroke="{INK}" stroke-width=".49"/><rect x="39.8" y="441.8" width="17.4" height="96.4" stroke="{INK}" stroke-width=".98"/>')
m += body(dict(size='уточняется'), GC) + '<img class="qr" src="qr3d.png">'
secs.append(full(GC, '#dfe6da', 'БОРДЮР ВЕРСАЧЕ', 'СЕТКА', '016', '019', m, SCN['bordA'], 'БОРДЮР ВЕРСАЧЕ · СЕТКА'))
# №017 Terratsso
TC = '#2b2d33'
def tsk():
    S = 50; y0 = 372; o = ''
    for x0, cells in ((59.24, (1, 1)), (176, (2, 1)), (292, (2, 2))):
        wl = '400' if cells[0] == 1 else '200'; hl = '200' if cells[1] == 2 else '400'
        nx, ny = cells; g = 0 if cells == (1, 1) else 3.2; cw, chh = (S - g * (nx - 1)) / nx, (S - g * (ny - 1)) / ny
        o += f'<rect x="{x0-4.83}" y="{y0-4.83}" width="{S+9.66}" height="{S+9.66}" stroke="{INK}" stroke-width=".49"/>'
        for i in range(nx):
            for j in range(ny): o += f'<rect x="{x0+i*(cw+g):.2f}" y="{y0+j*(chh+g):.2f}" width="{cw:.2f}" height="{chh:.2f}" stroke="{INK}" stroke-width=".98"/>'
        o += dims(x0, y0, cw, chh, wl, hl, TC, yb=y0 + S)
    return svg(o)
t = ''
for src, x, y in (('1', 134.5, 80), ('2', 62, 213), ('3', 207, 213)): t += f'<img class="mold" src="trotuar-terratsso-{src}-mold-a.webp" style="left:{x}px;top:{y}px">'
t += T(34.02, 363, 5.46, 600, 1.088, LAB, 'ЭСКИЗ · РАЗМЕР ПЛИТКИ, ММ') + line(154, 361, 213, .1608) + tsk()
for x, l, txt in ((35.14, 'А', ' · h 50'), (151.9, 'Б', ' · h 50 · 2 ячейки'), (267.9, 'В', ' · h 50 · 4 ячейки')):
    t += T(x, 451, 5.46, 800, 0, TC, l) + T(x + 5.2, 451, 5.46, 600, .216, HLAB, txt, extra='white-space:pre')
t += T(52.91, 462, 5.46, 600, 1.088, LAB, 'РАЗМЕР, ММ') + T(221.12, 462, 5.46, 600, 1.088, LAB, 'НА 1 М²')
for k, (l, size, per) in enumerate((('А', '400×400×50', '6,25 шт'), ('Б', '400×200×50', '12,5 шт'), ('В', '200×200×50', '25 шт'))):
    yb = (477, 492, 506)[k]; t += line(34, (467, 481, 496)[k], 274, .102)
    t += T(34.02, yb, 8.39, 700, 0, TC, l) + T(52.91, yb, 8.39, 600, -.01, INK, size) + T(221.12, yb, 8.39, 600, -.01, INK, per)
t += line(34, 515, 274, .1608) + T(34.02, 526, 5.46, 600, 1.088, LAB, 'МАТЕРИАЛ') + T(34.02, 537, 8.26, 600, 0, INK, 'Полипропилен · АБС')
t += '<img class="qr" src="qr.png">'
secs.append(full(TC, '#efede8', 'ТЕРРАЦЦО', '№1 · №2 · №3', '017', '020', t, 'terr_scene.jpg', 'ТЕРРАЦЦО'))
faces = ''.join(f"@font-face{{font-family:Inter;font-weight:{w};src:url({F}/inter-{s}-{w}-normal.woff2) format('woff2');unicode-range:{u}}}" for w in (400, 600, 700, 800) for s, u in (('cyrillic', 'U+0400-04FF,U+2116'), ('latin', 'U+0000-00FF,U+00D7,U+00B7,U+00B2,U+00D8')))
open('nv.html', 'w').write(f'''<!doctype html><html lang="ru"><meta charset="utf-8"><style>{faces}
@page{{size:{PW}px {PH}px;margin:0}}*{{margin:0;padding:0;box-sizing:border-box}}
body{{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
section{{position:relative;width:{PW}px;height:{PH}px;page-break-after:always;overflow:hidden}}
.t{{position:absolute;white-space:nowrap}}.ln{{position:absolute;height:1px;background:{INK}}}
.sk{{position:absolute;left:0;top:0}}
.bdg{{position:absolute;top:38px;height:12px;width:52px;background:#fff;border-radius:1.9px}}
.tab{{position:absolute;left:397px;top:519px;height:18px;padding:0 11px 0 11.94px;font:700 6px/18px Inter;letter-spacing:1.32px;color:#fff;white-space:nowrap}}
.full .lbg{{position:absolute;left:0;top:0;width:397px;height:100%}}.full .lbg::before{{content:"";position:absolute;inset:0;background:url(kirpich.webp) 0 0/45px auto;opacity:.035}}
.full .hbg{{position:absolute;left:0;top:0;width:397px;height:64px;overflow:hidden}}.full .hbg::before{{content:"";position:absolute;inset:0;background:url(kirpich.webp) 0 0/45px auto;opacity:.13;filter:invert(1)}}
.logo{{position:absolute;left:256px;top:21.76px;width:37.12px;opacity:.92}}
.num{{right:{PW - 371.12 - 0.536}px;font:800 26.66px/26.66px Inter;letter-spacing:-.536px;color:#fff}}
.mold{{position:absolute;width:128px;height:128px;object-fit:contain;filter:drop-shadow(0 11px 10px rgba(20,22,26,.30)) drop-shadow(0 2px 2.5px rgba(20,22,26,.22))}}
.qr{{position:absolute;left:326.6px;top:499.3px;width:40px;height:40px;image-rendering:pixelated}}
.scene{{position:absolute;left:397px;top:0;width:{PW - 397}px;height:100%;object-fit:cover}}
</style><body>{''.join(secs)}
<script>for(const h of document.querySelectorAll('.hdr')){{const s=h.querySelector('.sub'),b=h.querySelector('.bdg'),t=h.querySelector('.bdt');const x=s.textContent?Math.round((34.02+s.getBoundingClientRect().width+8.2)*100)/100:34;b.style.left=x+'px';t.style.left=(x+6.53)+'px'}}</script></body></html>''')
subprocess.run(['node', '-e', '''
const {chromium}=require('/home/claude/spsplast/node_modules/playwright');(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1254/chrome-linux64/chrome'});const p=await b.newPage();
await p.goto('file:///tmp/pdfw/nv.html',{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
await p.pdf({path:'/tmp/pdfw/nv.pdf',printBackground:true,preferCSSPageSize:true});await b.close()})()'''], check=True)
ov = pikepdf.open('nv.pdf'); print('overlay betlari', len(ov.pages), ov.pages[0].MediaBox); assert len(ov.pages) == len(order) + 2
def place(pg, src_page, name):
    fx = pdf.copy_foreign(src_page.as_form_xobject()); nm = pg.add_resource(fx, Name.XObject, prefix=name)
    return f'q\n{SX} 0 0 {SY} 0 0 cm\n{nm} Do\nQ\n'.encode()
for k, idx in enumerate(order):
    pg = pdf.pages[idx]; pg.contents_add(pdf.make_stream(place(pg, ov.pages[k], 'Ov')), prepend=False)
# To'liq betlar: 19-bet (№016 bordyur setka) va 20-bet (№017 Terratsso) — o'rinbosarlar o'rniga
for k, at in ((len(order), 18), (len(order) + 1, 19)):
    newp = pikepdf.Page(pdf.make_indirect(pikepdf.Dictionary(Type=Name.Page, MediaBox=[0, 0, 595.28, 419.53], Resources=pikepdf.Dictionary(), Contents=pdf.make_stream(b''))))
    pdf.pages.insert(at, newp); newp = pdf.pages[at]
    newp.Contents = pdf.make_stream(place(newp, ov.pages[k], 'Fp'))
    del pdf.pages[at + 1]
# Bordyur (18-bet): qolip va sahna rasmlari
bp = pdf.pages[17]; form = FORMS[17]
c = form.read_bytes().decode('latin1')
m = re.search(r'q\n1 0 0 1 371 284 cm\n((?:0 0 0 RG 0 0 0 rg\n)?/G\d+ gs\n(?:EMC\n)?)(/X\d+) Do\nQ\n', c); assert m
W_, H_ = 162.7 * 3.125, 349.4 * 3.125
c = c.replace(m.group(0), f'q\n1 0 0 1 {117.15 * 3.125} {72 * 3.125} cm\n{m.group(1)}{m.group(2)} Do\nQ\n'); form.write(c.encode('latin1'))
mf = form.Resources.XObject[m.group(2)]; img = [v for v in mf.Resources.XObject.values()][0]; iname = list(mf.Resources.XObject.keys())[0]
mf.BBox = [0, 0, W_, H_]; mf.write(f'q\n{W_} 0 0 -{H_} 0 {H_} cm\n/G3 gs\n{iname} Do\nQ\n'.encode())
def setscene(idx, path):
    pg_ = pdf.pages[idx]; im = [v for k, v in pg_.Resources.XObject.items() if v.get('/Subtype') == '/Image']; assert len(im) == 1, (idx, len(im))
    hh_, ww_ = cv2.imread(path).shape[:2]; r0 = int(im[0].Width) / int(im[0].Height); assert abs(ww_ / hh_ / r0 - 1) < 0.02, (idx, path, ww_ / hh_, r0)
    setimg(im[0], path, ww_, hh_)
def setimg(o, path, w, h):
    o.write(open(path, 'rb').read(), filter=Name.DCTDecode); o.Width, o.Height = w, h
    for k in ('/ColorTransform', '/DecodeParms', '/SMask'):
        if k in o: del o[k]
hh, ww = cv2.imread('bord_mold_B.jpg').shape[:2]; setimg(img, 'bord_mold_B.jpg', ww, hh); print('mold', ww, hh, ww / hh, W_ / H_)
sc = [v for k, v in bp.Resources.XObject.items() if v.get('/Subtype') == '/Image'][0]; setscene(17, SCN['bordB'])
for idx, path in sorted(SCENES.items()):
    setscene(idx, path); print('sahna', idx + 1, path.split('/')[-1])
pdf.save(f'out7_{VAR}.pdf', linearize=True, object_stream_mode=pikepdf.ObjectStreamMode.generate)
print('betlar', len(pdf.pages))
