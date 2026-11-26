# 2026-11-26: old/oxirgi betlar + «Коллекция 2027» uchun rasmlar. Chiqish: /tmp/pdfw/p9/{web,max}/
import subprocess, os, qrcode
from PIL import Image, ImageFilter, ImageEnhance
import numpy as np
Image.MAX_IMAGE_PIXELS = None
U = '/tmp/nw3/'; STD = '/home/claude/std/'
DPI = {'web': 170, 'max': 300}; Q = {'web': 86, 'max': 95}
def fit(src, name, wmm, hmm, anchor=(.5, .5), var='max', post=None):
    im = Image.open(src).convert('RGB'); w, h = im.size; ar = wmm / hmm
    if w / h > ar: nw = round(h * ar); x = round((w - nw) * anchor[0]); im = im.crop((x, 0, x + nw, h))
    else: nh = round(w / ar); y = round((h - nh) * anchor[1]); im = im.crop((0, y, w, y + nh))
    tw = round(wmm / 25.4 * DPI[var]); th = round(hmm / 25.4 * DPI[var])
    if tw > im.width: im = im.resize((tw, th), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.2, 60, 2))
    elif tw < im.width: im = im.resize((tw, th), Image.LANCZOS)
    if post: im = post(im)
    im.save(f'{var}/{name}.jpg', quality=Q[var], subsampling=0 if var == 'max' else 1)
def dark(im):   # orqa muqova: kulrang + chapdan to'q gradient (CSS filtrlari ba'zi PDF ko'rgichlarda tushib qoladi)
    a = np.asarray(ImageEnhance.Color(im).enhance(0.12)).astype(np.float32); x = np.linspace(0, 1, a.shape[1])
    k = np.interp(x, [0, .45, 1], [.95, .86, .38])[None, :, None]
    return Image.fromarray((a * (1 - k) + np.array([23, 23, 26], np.float32) * k).clip(0, 255).astype(np.uint8))
def cutout(src, name, rot=0, size=1500, var='max'):
    im = Image.open(src).convert('RGBA'); im = im.crop(im.getchannel('A').getbbox())
    size = size if var == 'max' else round(size * .6)
    s = size / max(im.size); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    if rot: im = im.rotate(rot, expand=True, resample=Image.BICUBIC)
    pad = round(size * .12); cv = Image.new('RGBA', (im.width + 2 * pad, im.height + 2 * pad), (0, 0, 0, 0))
    sh = Image.new('RGBA', cv.size, (0, 0, 0, 0)); sh.paste(Image.new('RGBA', im.size, (0, 0, 0, 150)), (pad + round(size * .011), pad + round(size * .035)), im.getchannel('A'))
    cv.alpha_composite(sh.filter(ImageFilter.GaussianBlur(size * .03))); cv.alpha_composite(im, (pad, pad)); cv.save(f'{var}/{name}.png')
for var in ('web', 'max'):
    os.makedirs(var, exist_ok=True)
    fit(U + 'u5.png', 'cover', 120, 148, (.5, .5), var)             # Афсона — o'zbek peshtoqi fonida
    fit(U + 'u10.png', 'order', 84, 148, (.5, .5), var)             # Рояль 2
    fit(U + 'u6.png', 'contact', 92, 148, (.5, .5), var)            # Азалия 1
    fit(U + 'u3.png', 'back', 210, 148, (.5, .78), var, post=dark)  # Ромбик новый
    fit('/home/claude/spsplast/public/images/site/factory.webp', 'factory', 112, 92, (.42, .5), var)
    cutout(STD + '087_Афсона юлдуз.png', 'cmold', rot=10, var=var)
    cutout(STD + '086_Афсона кубик.png', 'cmold2', rot=-8, size=900, var=var)
    for nm in ('logo-white', 'logo-ink'):
        Image.open(f'/home/claude/spsplast/public/images/brand/{nm}.webp').save(f'{var}/{nm}.png')
    Image.open('/home/claude/cat2/img/logo.png').save(f'{var}/logo.png')
    for k, url in (('qsite', 'https://spsplast.uz'), ('q3d', 'https://spsplast.uz/3d/'), ('qwa', 'https://wa.me/998983007772'), ('qtg', 'https://t.me/spsplastuz')):
        qrcode.make(url, border=1, box_size=10).save(f'{var}/{k}.png')
# «Коллекция 2027»: novinka betlaridan (4..20) sahna va qolip kesimlari
subprocess.run(['pdftoppm', '-f', '4', '-l', '20', '-r', '300', '-png', '/tmp/pdfw/out7_max.pdf', 'nvp'], check=True)
for i, p in enumerate(range(4, 21), 1):
    im = Image.open(f'nvp-{p:03d}.png').convert('RGB'); W, H = im.size
    sc = im.crop((round(W * .5), 0, W, H))                                   # o'ng yarim = sahna
    for var in ('web', 'max'):
        w = 300 if var == 'web' else 520
        t = sc.crop((round(sc.width * .06), round(sc.height * .16), round(sc.width * .94), round(sc.height * .86)))
        t = t.resize((w, round(w * t.height / t.width)), Image.LANCZOS); t.save(f'{var}/nv{i:02d}.jpg', quality=Q[var])
    os.remove(f'nvp-{p:03d}.png')
print('ok')
