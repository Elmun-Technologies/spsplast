# fix8.py — build8.py oxirida exec qilinadi (pdf = 129 bet, Rim hali o'chirilmagan).
# 2026-11-26 mijoz bilan uchrashuv: trotuar qoliplari faqat PP; Rim (№005) yo'q — keyingi raqamlar -1;
# Astana 30×30; Bordyur Versache 600×160×50; Versache 2 — og'irlik (jadval Versache 1 betidan, qiymatlar bir xil).
import re
GID = {'0': '053D', '1': '053E', '2': '053F', '3': '0541', '4': '0542', '5': '0543', '6': '0545', '7': '0546', '8': '0547', '9': '0548',
       '×': '0601', ' ': '06F1', '*': '060C'}
CH = {v: k for k, v in GID.items()}
BLK = re.compile(r'BT\n/(F\d+) ([\d.]+) Tf\n1 0 0 -1 (-?[\d.]+) (-?[\d.]+) Tm\n(.*?)ET\n', re.S)


def forms(pg):
    return [v for k, v in pg.Resources.XObject.items() if v.get('/Subtype') == '/Form']


def widths(font):
    D = font.DescendantFonts[0]; W = list(D.get('/W', [])); out = {}; i = 0
    while i < len(W):
        a = int(W[i]); b = W[i + 1]
        if isinstance(b, pikepdf.Array):
            for j, w in enumerate(b): out[a + j] = float(w)
            i += 2
        else:
            for g in range(a, int(b) + 1): out[g] = float(W[i + 2])
            i += 3
    return out, float(D.get('/DW', 1000))


def gl(body): return re.findall(r'<([0-9A-F]{4})>', body)


def retext(form, c, m, text, align='l'):
    fn, fss, x, y, body = m.groups(); fs = float(fss)
    W, DW = widths(form.Resources.Font['/' + fn])
    adv = lambda g: W.get(int(g, 16), DW) * fs / 1000
    old = gl(body); td = [float(v) for v in re.findall(r'(-?[\d.]+) 0 Td', body)]
    ls = (td[0] - adv(old[0])) if td else 0
    new = [GID[ch] for ch in text]
    ow = sum(adv(g) for g in old) + ls * (len(old) - 1); nw = sum(adv(g) for g in new) + ls * (len(new) - 1)
    x = float(x) + {'l': 0, 'r': ow - nw, 'c': (ow - nw) / 2}[align]
    s = f'BT\n/{fn} {fss} Tf\n1 0 0 -1 {x:.5f} {y} Tm\n<{new[0]}> Tj\n'
    for i in range(1, len(new)):
        t = f'{adv(new[i - 1]) + ls:.7f} 0 Td <{new[i]}> Tj\n'
        s += f'/Span<</ActualText <FEFF00D7> >> BDC\n{t}EMC\n' if new[i] == '0601' else t
    return c[:m.start()] + s + 'ET\n' + c[m.end():]


def edit(idx, pick, text, align='l', n=1):
    """idx-betdagi `pick(fs, glyphlar)` ga mos BT blok(lar)ni `text` bilan qayta yozadi."""
    done = 0
    for f in forms(pdf.pages[idx]):
        c = f.read_bytes().decode('latin1')
        while True:
            m = next((m for m in BLK.finditer(c) if pick(m.group(2), gl(m.group(5)))), None)
            if not m: break
            c = retext(f, c, m, text, align); done += 1
            if done >= n: break
        f.write(c.encode('latin1'))
        if done >= n: break
    assert done == n, (idx, text, done)


# 1) Novinka betlari 9..18 (idx 8..17, №006..№015): model va bet raqami -1 (Rim olib tashlanadi)
for idx in range(8, 18):
    hit = 0
    for f in forms(pdf.pages[idx]):
        c = f.read_bytes().decode('latin1'); ch = False
        for fs, exp in (('26.66', idx - 2), ('6', idx + 1)):
            fonts = f.Resources.get('/Font', {}) if '/Resources' in f else {}
            m = [m for m in BLK.finditer(c) if m.group(2) == fs and len(gl(m.group(5))) == 3 and '/' + m.group(1) in fonts]
            if len(m) != 1: continue
            old = ''.join(CH[g] for g in gl(m[0].group(5))); assert old == f'{exp:03d}', (idx, fs, old, exp)
            c = retext(f, c, m[0], f'{exp - 1:03d}', 'r'); ch = True; hit += 1
        if ch: f.write(c.encode('latin1'))
    assert hit == 2, (idx, hit)

# 2) Versache 2 (idx 30) jadvali = Versache 1 (idx 29) jadvali: 300×300×30 · 11 шт · 360 г · 3 960 г (mijoz, 2026-11-26)
def big(idx): return max(forms(pdf.pages[idx]), key=lambda v: len(v.read_bytes()))
def table(c):
    a = re.search(r'\n161 (\d+) 206 1 re\nf\n', c).start() + 1
    mat = [m for m in BLK.finditer(c) if m.group(2) == '8.2600002' and len(gl(m.group(5))) == 18][-1]
    base = int(re.search(r'3\.125 0 0 3\.125 0 -(\d+) cm', c).group(1)) / 3.125
    return a, mat.end(), base
f1, f2 = big(29), big(30)
c1, c2 = f1.read_bytes().decode('latin1'), f2.read_bytes().decode('latin1')
a1, e1, b1 = table(c1); a2, e2, b2 = table(c2); dy = b2 - b1
assert c1.count('BT', a1, e1) == 10 and c2.count('BT', a2, e2) == 6, (c1.count('BT', a1, e1), c2.count('BT', a2, e2))
seg = c1[a1:e1]
seg = re.sub(r'(1 0 0 -1 [\d.]+ )([\d.]+)( Tm)', lambda m: f'{m.group(1)}{float(m.group(2)) + dy:g}{m.group(3)}', seg)
seg = re.sub(r'(?m)^(\d+) ([\d.]+) (\d+ 1 re)$', lambda m: f'{m.group(1)} {float(m.group(2)) + dy:g} {m.group(3)}', seg)
_mc = iter(range(900, 999)); seg = re.sub(r'MCID \d+', lambda m: f'MCID {next(_mc)}', seg)
f2.write((c2[:a2] + seg + c2[e2:]).encode('latin1'))

# 3) Material: hamma betlarda "Полипропилен · АБС" -> "Полипропилен" (asl matn bloklari; qayta terilganlari build8.py da)
npp = 0
for idx in range(len(pdf.pages)):
    for f in forms(pdf.pages[idx]):
        c = f.read_bytes().decode('latin1'); out = []; last = 0
        for m in BLK.finditer(c):
            g = gl(m.group(5))
            if len(g) == 18 and g[12] == '06F1' and g[13] == '05E5' and g[14] == '06F1':
                body = m.group(5); cut = [x.end() for x in re.finditer(r'> Tj\n', body)][11]
                out.append(c[last:m.start(5)] + body[:cut]); last = m.end(5); npp += 1
        if out:
            f.write((''.join(out) + c[last:]).encode('latin1'))
print('PP: material bloklari', npp)

# 4) Astana (idx 73): 298 -> 300 (eskiz va jadval)
edit(73, lambda fs, g: fs.startswith('6.4') and g == ['053F', '0548', '0547'], '300', 'c', n=2)
edit(73, lambda fs, g: fs == '8.3900003' and [CH.get(x, '?') for x in g] == list('298×298×38*'), '300×300×38*')

# 5) Bordyur Versache (idx 17): "уточняется" -> 600×160×50
edit(17, lambda fs, g: fs == '8.3900003' and len(g) == 10 and '0601' not in g, '600×160×50')


# 7) «Материал» beti (oxiridan 4-chi): trotuar formalari faqat PP — chap panel matni qayta terildi, ABS namunasi olib tashlandi
_mi = len(pdf.pages) - 4
_mp = pdf.pages[_mi]; _c = _mp.Contents.read_bytes().decode('latin1')
assert '197 2470 49 30 re' in _c and 'Inter' in str(_mp.Resources.Font['/F33'].get('/BaseFont'))
_c, _n = re.subn(r'BT\n(?:(?!ET\n).)*?1 0 0 -1 (\d+(?:\.\d+)?) \d+(?:\.\d+)? Tm\n.*?ET\n', lambda m: '' if float(m.group(1)) < 370 else m.group(0), _c, flags=re.S)
_c = _c.replace('197 2470 49 30 re\nf\n', '').replace('197.5 2470.5 48 29 re\nS\n', '')
_mp.Contents = pdf.make_stream(_c.encode('latin1'))
_FD = '/tmp/pdfw/node_modules/@fontsource/inter/files'
_faces = ''.join(f"@font-face{{font-family:I;font-weight:{w};src:url(file://{_FD}/inter-{s}-{w}-normal.woff2) format('woff2');unicode-range:{u}}}"
                 for w in (400, 700, 800) for s, u in (('latin', 'U+0000-00FF,U+2013-2014'), ('cyrillic', 'U+0400-045F')))
_T = lambda x, base, fs, wt, col, ls, txt, w=None: (f'<div style="position:absolute;left:{x}px;top:{base - 0.86378 * fs:.2f}px;font:{wt} {fs}px/{fs}px I;'
                                                    f'letter-spacing:{ls}em;color:{col};white-space:{"normal" if w else "nowrap"};{f"width:{w}px" if w else ""}">{txt}</div>')
_GR = 'rgb(189,185,179)'
_h = (_T(45.34, 56, 6.93, 700, '#E5262A', .25, 'МАТЕРИАЛ') + _T(45.34, 99, 33.33, 800, '#fff', -.02, 'Полипропилен —')
      + _T(45.34, 133, 33.33, 800, '#fff', -.02, 'форма на годы<span style="color:#E5262A">.</span>')
      + _T(45.34, 165, 8.8, 400, _GR, 0, '<span style="line-height:13.5px;display:block;margin-top:0">Все формы для тротуарной плитки SPS выпускаются из полипропилена (PP). '
           'Фасадные, заборные и декоративные формы — также из ABS-пластика.</span>', 282)
      + _T(45.34, 278, 8.8, 700, '#fff', .02, 'PP · ПОЛИПРОПИЛЕН')
      + _T(45.34, 293, 7.46, 400, _GR, 0, '<span style="line-height:11px;display:block">Чёрная форма. Гибкая и ударостойкая, легко снимается с изделия '
           'и выдерживает многократную заливку.</span>', 282))
open('mat.html', 'w').write(f'<!doctype html><meta charset="utf-8"><style>{_faces}@page{{size:595.28pt 419.53pt;margin:0}}*{{margin:0;padding:0}}'
                            f'body{{-webkit-print-color-adjust:exact;print-color-adjust:exact;position:relative;width:595.28pt;height:419.53pt;overflow:hidden}}</style><body>{_h}</body>')
subprocess.run(['node', '-e', '''
const {chromium}=require('/home/claude/spsplast/node_modules/playwright');(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1254/chrome-linux64/chrome'});const p=await b.newPage();
await p.goto('file:///tmp/pdfw/mat.html',{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
await p.pdf({path:'/tmp/pdfw/mat.pdf',printBackground:true,preferCSSPageSize:true});await b.close()})()'''], check=True)
_mo = pikepdf.open('mat.pdf'); assert len(_mo.pages) == 1
_fx = pdf.copy_foreign(_mo.pages[0].as_form_xobject()); _nm = _mp.add_resource(_fx, Name.XObject, prefix='Mt')
_mp.Contents = pdf.make_stream(b'q\n' + _mp.Contents.read_bytes() + b'\nQ\nq\n/' + str(_nm)[1:].encode() + b' Do\nQ\n')
print('material beti: olib tashlangan matn bloklari', _n)

# 6) Rim beti
del pdf.pages[7]
print('fix8: betlar', len(pdf.pages))
