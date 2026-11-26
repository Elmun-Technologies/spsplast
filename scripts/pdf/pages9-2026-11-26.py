# 2026-11-26 (egasi): boshidagi 3 bet (muqova, zavod, «Коллекция 2027») + oxirgi 3 bet (buyurtma, kontaktlar, orqa muqova)
# qayta terildi; novinka betlariga (4..20) osma «2027» belgisi qatlami. Chiqish: /tmp/pdfw/p9/pages9_<web|max>.pdf
# (1-6 bet = to'liq betlar, 7-23 = shaffof qatlamlar). Rasmlar: assets.py.
import sys, os, subprocess
VAR = sys.argv[1]
SITE = 'spsplast.uz'
NV = ['АНТАРА', 'АНТАРА 2', 'НАЦИОНАЛ 1', 'НАЦИОНАЛ 2', 'КРЫМ · ВАЛДАЙ · САЯНЫ', 'СЛАНЕЦ', 'ЛАБИРИНТ', 'ДОРОЖКА КРУГЛАЯ',
      'ДОРОЖКА ПОЛОСА', 'ПЛЕТЁНКА', 'ПАРКЕТ', 'СПИЛ ДЕРЕВА', 'КАДАМ', 'БОРДЮР ВЕРСАЧЕ', 'БОРДЮР ВЕРСАЧЕ СЕТКА', 'ТЕРРАЦЦО']
TAB = '<div class="nt{c}"><s>{a}</s><b>2027</b><u>КОЛЛЕКЦИЯ</u></div>'

EXPORT = 'Россия · Казахстан · Беларусь · Кыргызстан · Таджикистан · Азербайджан · Армения · Грузия'
COVER = os.environ.get('COVER', 'graphite')   # graphite (tanlangan) | light | red — rasmsiz tipografik muqova, yil yozilmaydi (egasi, 2026-11-26)
def cover_html(theme):
    logo = {'light': 'logo', 'red': 'logo-allwhite'}.get(theme, 'logo-white')
    return f"""<section class="pg cv cv-{theme}"><img class="bg" src="{VAR}/covbg-{theme}.jpg">{TAB.format(c=' nt-cv', a='НОВИНКИ')}
<img class="cv-logo" src="{VAR}/{logo}.png">
<div class="cv-mid"><div class="kick">ФОРМЫ ДЛЯ ТРОТУАРНОЙ ПЛИТКИ</div><h1>КАТАЛОГ</h1>
<p>Пластиковые формы из полипропилена —<br>напрямую с завода в Ташкенте.</p></div>
<div class="cv-b"><div class="cv-facts"><div><b>20<em>лет</em></b><span>ОПЫТА</span></div><div><b>18 000<em>м²</em></b><span>В МЕСЯЦ</span></div>
<div><b>740+</b><span>ОБЪЕКТОВ</span></div><div><b>8<em>стран</em></b><span>ЭКСПОРТ</span></div></div>
<div class="cv-ex"><span>ЭКСПОРТ</span>{EXPORT}</div></div><div class="cv-site">{SITE}</div></section>"""
cover = cover_html(COVER)

about = f'''<section class="pg ab"><div class="ab-l"><div class="kick">О КОМПАНИИ</div><h2 class="fh">Завод<br>в Ташкенте<i>.</i></h2>
<p class="fp">Stone Profy Servise (SPS) 20 лет производит пластиковые формы для тротуарной плитки, фасадного декора, еврозаборов и малых архитектурных форм. Собственное производство из полипропилена (PP) и ABS-пластика: вы покупаете у завода, без посредников.</p>
<div class="rng"><span>ФОРМЫ ДЛЯ</span><div><b>Тротуарной плитки</b><b>Фасадной плитки</b><b>Термопанелей</b><b>Фасадного декора</b><b>Еврозаборов</b><b>Скамеек</b></div></div>
<div class="stats"><div><b>20<em>лет</em></b><span>ОПЫТА</span></div><div><b>18 000<em>м²</em></b><span>В МЕСЯЦ</span></div><div><b>740+</b><span>ОБЪЕКТОВ</span></div><div><b>8<em>стран</em></b><span>ЭКСПОРТ</span></div></div></div>
<div class="ab-r"><img src="{VAR}/factory.jpg"><div class="ab-cap">ПРОИЗВОДСТВО · ТАШКЕНТ</div>
<div class="ab-f"><div><i>01</i><b>Напрямую с завода</b><p>Производство, склад и отгрузка — в одном месте.</p></div>
<div><i>02</i><b>Форма в 3D</b><p>QR-код на странице модели открывает форму и раскладку плитки в 3D.</p></div>
<div><i>03</i><b>Под ваш проект</b><p>Изготовим форму по вашему образцу или чертежу.</p></div></div>
<div class="ab-ex"><span>ЭКСПОРТ В 8 СТРАН</span>{EXPORT}</div></div></section>'''

NVIMG = [1, 2, 3, 4] + list(range(6, 18))   # nvNN.jpg — eski tartib (05 = Rim, olib tashlandi 2026-11-26)
cells = ''.join(f'<div class="cc"><img src="{VAR}/nv{NVIMG[i - 1]:02d}.jpg"><em>№ {i:03d}</em><b>{n}</b></div>' for i, n in enumerate(NV, 1))
coll = f'''<section class="pg co"><div class="co-l"><div class="kick">НОВИНКИ</div><h2 class="co-h">Коллекция<br><span>2027</span></h2>
<p class="co-p">Новые формы сезона — в начале каталога: национальные орнаменты, плиты крупного формата, тактильная плитка и бордюры.</p>
<div class="co-key">{TAB.format(c=' nt-key', a='НОВИНКА')}<p>Страницы новинок отмечены<br>этим знаком.</p></div>
<img class="co-logo" src="{VAR}/logo-white.png"></div>
<div class="co-g">{cells}<div class="cc cc-r"><b>Новые<br>формы<br>сезона</b><span>→</span></div></div></section>'''

order = f'''<section class="pg od"><div class="od-l"><div class="kick">ЗАКАЗ</div><h2 class="fh">Как заказать<br>формы<i>.</i></h2><div class="olist">
<div><i>01</i><b>ВЫБЕРИТЕ МОДЕЛЬ</b><p>В каталоге или на сайте {SITE}. Номер модели указан на каждой странице.</p></div>
<div><i>02</i><b>ОСТАВЬТЕ ЗАЯВКУ</b><p>Позвоните или напишите в Telegram / WhatsApp. Назовите номер модели и площадь — менеджер рассчитает количество форм и стоимость.</p></div>
<div><i>03</i><b>ОТГРУЗКА С ЗАВОДА</b><p>Формы комплектуются и отгружаются со склада в Ташкенте.</p></div>
<div><i>04</i><b>ДОСТАВКА</b><p>По Узбекистану и в страны СНГ — с инвойсом и упаковочным листом.</p></div></div>
<div class="od-n">Цены в каталоге не указаны: стоимость зависит от модели, материала формы и объёма заказа.</div></div>
<div class="od-r"><img class="bg" src="{VAR}/order.jpg"><div class="card"><div class="kick">3D ОНЛАЙН</div><b>Каждая форма в 3D</b>
<p>QR-код на странице модели открывает 3D-просмотр: форму можно повернуть и рассмотреть со всех сторон.</p>
<div class="q"><img src="{VAR}/q3d.png"><span>{SITE}/3d<br><em>КАТАЛОГ 3D-МОДЕЛЕЙ</em></span></div></div></div></section>'''

ct = [('+998 33 338 77 72', 'ПРОДАЖИ'), ('+998 33 888 77 72', 'ПРОДАЖИ'), ('+998 78 777 00 07', 'ОФИС'), ('@spsplast.uz', 'INSTAGRAM')]
qr = [('qwa', 'WHATSAPP', '+998 98 300 77 72'), ('qtg', 'TELEGRAM', '@spsplastuz'), ('qsite', 'САЙТ', SITE)]
contact = f'''<section class="pg en"><div class="en-l"><img class="logo" src="{VAR}/logo.png"><div class="kick" style="margin-top:7mm">КОНТАКТЫ</div>
<h2 class="fh">Рассчитаем<br>ваш заказ<i>.</i></h2>
<div class="en-main"><b>+998 98 300 77 72</b><span>ОТДЕЛ ПРОДАЖ · ЗВОНОК И WHATSAPP</span></div>
<div class="ctl">{''.join(f'<div><b>{a}</b><span>{b}</span></div>' for a, b in ct)}</div>
<div class="qrs">{''.join(f'<div><img src="{VAR}/{k}.png"><span>{a}</span><b>{b}</b></div>' for k, a, b in qr)}</div></div>
<div class="en-r"><img class="bg" src="{VAR}/contact.jpg"><div class="addr"><span>АДРЕС ЗАВОДА</span><b>Ташкент, Учтепинский район,<br>ул. Халка йули, 7A</b><em>Пн–Сб · 09:00–18:00</em></div></div></section>'''

back = f'''<section class="pg bk"><img class="bg" src="{VAR}/back.jpg"><div class="bk-c"><img class="bk-logo" src="{VAR}/logo-white.png">
<div class="bk-t">Формы для тротуарной плитки,<br>фасада и декора — с завода<br>в Ташкенте<i>.</i></div>
<div class="bk-l"><span>+998 98 300 77 72</span><span>{SITE}</span><span>@spsplastuz</span></div></div>
<div class="bk-q"><img src="{VAR}/qsite.png"><span>{SITE}</span></div><div class="bk-f">STONE PROFY SERVISE · ТАШКЕНТ · ЭКСПОРТ В 8 СТРАН</div></section>'''

tabs = ''.join(f'<section class="pg ov">{TAB.format(c="", a="НОВИНКА")}</section>' for _ in NV)

FD = '/tmp/pdfw/node_modules/@fontsource/inter/files'
FACES = ''.join(f"@font-face{{font-family:InterC;font-weight:{w};src:url(file://{FD}/inter-{sub}-{w}-normal.woff2) format('woff2');unicode-range:{ur}}}"
                for w in (400, 500, 600, 700, 800) for sub, ur in (('latin', 'U+0000-00FF,U+2013-2014,U+2018-201D,U+2022,U+2116,U+2192'), ('cyrillic', 'U+0400-045F,U+2116')))
CSS = FACES + '''
@page{size:210mm 148mm;margin:0}
*{margin:0;padding:0;box-sizing:border-box}
html,body{font-family:InterC,Inter,sans-serif;-webkit-font-smoothing:antialiased}
.pg{position:relative;width:210mm;height:148mm;overflow:hidden;page-break-after:always;background:#EEEAE4;color:#17171a}
.pg.ov{background:none}
img{display:block}
.bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.kick{font-size:5.2pt;letter-spacing:.34em;color:#E5262A;font-weight:700}
.fh{font-size:25pt;line-height:1.02;font-weight:800;letter-spacing:-.015em;margin:3.2mm 0 4.5mm}
.fh i,.bk-t i{font-style:normal;color:#E5262A}
.fp{font-size:6.8pt;line-height:1.58;color:#4a4744}
.logo{width:25mm}
/* osma belgi */
.nt{position:absolute;top:0;right:8mm;width:19mm;height:26mm;background:#E5262A;color:#fff;text-align:center;clip-path:polygon(0 0,100% 0,100% 100%,50% 87%,0 100%)}
.nt s{display:block;text-decoration:none;font-size:3.7pt;font-weight:700;letter-spacing:.24em;padding-left:.24em;margin-top:4.8mm}
.nt b{display:block;font-size:13.5pt;line-height:1;font-weight:800;letter-spacing:-.02em;margin-top:1.3mm}
.nt u{display:block;text-decoration:none;font-size:3.2pt;font-weight:600;letter-spacing:.22em;padding-left:.22em;margin-top:1.3mm;opacity:.92}
/* muqova */
.cv{color:#fff;background:#17171a}
.cv-logo{position:absolute;left:14mm;top:13mm;width:36mm}
.cv-mid{position:absolute;left:14mm;top:50mm}
.cv h1{font-size:60pt;line-height:.95;font-weight:800;letter-spacing:-.03em;margin:3mm 0 5mm -.6mm}
.cv p{font-size:7.4pt;line-height:1.5;color:#c9c5bf}
.cv-b{position:absolute;left:14mm;right:14mm;bottom:11mm}
.cv-facts{display:flex;gap:13mm;border-top:.25mm solid #55555b;padding-top:5mm}
.cv-facts b{display:block;font-size:17pt;line-height:1;font-weight:800;letter-spacing:-.02em;white-space:nowrap}
.cv-facts em{font-style:normal;font-size:6.2pt;color:#E5262A;margin-left:1.1mm;letter-spacing:0;font-weight:700}
.cv-facts span{display:block;margin-top:1.6mm;line-height:1;font-size:4.2pt;letter-spacing:.26em;color:#a9a5a0;font-weight:600}
.cv-ex{margin-top:5mm;font-size:5.6pt;font-weight:600;letter-spacing:.05em;color:#d9d6d1}
.cv-ex span{font-size:4.2pt;letter-spacing:.3em;color:#E5262A;font-weight:700;margin-right:3mm}
.cv-site{position:absolute;right:14mm;bottom:11mm;font-size:6.2pt;font-weight:700;letter-spacing:.14em}
.nt-cv{right:14mm;width:22mm;height:30mm}
.nt-cv s{margin-top:5.6mm;font-size:4.1pt}.nt-cv b{font-size:16pt}.nt-cv u{font-size:3.6pt}
.cv-light{color:#17171a;background:#EEEAE4}
.cv-light p{color:#4a4744}.cv-light .cv-facts{border-color:#17171a}.cv-light .cv-facts span{color:#8c8781}.cv-light .cv-ex{color:#4a4744}
.cv-red{background:#D7262E}
.cv-red .kick,.cv-red .cv-ex span,.cv-red .cv-facts em{color:#fff;opacity:.85}
.cv-red p,.cv-red .cv-ex,.cv-red .cv-facts span{color:#fff}.cv-red .cv-facts{border-color:rgba(255,255,255,.5)}
.cv-red .nt{background:#17171a}
/* zavod */
.ab-l{position:absolute;left:0;top:0;width:98mm;height:148mm;padding:13mm 9mm 0 12mm}
.stats{display:grid;grid-template-columns:1fr 1fr;gap:5mm 6mm;position:absolute;left:12mm;right:9mm;bottom:12mm;padding-top:5mm;border-top:.25mm solid #17171a}
.stats b{display:block;font-size:21pt;line-height:1.05;font-weight:800;letter-spacing:-.02em;white-space:nowrap}
.stats em{font-style:normal;font-size:6.6pt;color:#E5262A;margin-left:1.2mm;letter-spacing:0;font-weight:700}
.stats span{display:block;margin-top:1.4mm;line-height:1;font-size:4.3pt;letter-spacing:.24em;color:#8c8781;font-weight:600}
.rng{margin-top:7mm}
.rng span{font-size:4.3pt;letter-spacing:.26em;color:#8c8781;font-weight:600}
.rng div{display:grid;grid-template-columns:1fr 1fr;column-gap:6mm;margin-top:2mm}
.rng b{font-size:6.8pt;font-weight:600;padding:1.5mm 0;border-top:.2mm solid #d2ccc3}
.ab-r{position:absolute;right:0;top:0;width:112mm;height:148mm;background:#17171a}
.ab-r>img{width:112mm;height:92mm;object-fit:cover}
.ab-cap{position:absolute;right:7mm;top:84mm;color:#fff;font-size:4.4pt;letter-spacing:.3em;font-weight:600}
.ab-f{position:absolute;left:0;right:0;top:92mm;bottom:0;display:flex;gap:5mm;padding:6.5mm 9mm 0 9mm;color:#fff}
.ab-f div{flex:1;border-top:.25mm solid #45454b;padding-top:3mm}
.ab-f i{font-style:normal;color:#E5262A;font-weight:700;font-size:5.4pt;letter-spacing:.1em}
.ab-f b{display:block;font-size:7.6pt;font-weight:700;margin:1.4mm 0 1.2mm}
.ab-f p{font-size:5.7pt;line-height:1.5;color:#bdb9b3}
.ab-ex{position:absolute;left:9mm;right:9mm;bottom:6mm;border-top:.25mm solid #45454b;padding-top:2.6mm;font-size:5pt;font-weight:600;letter-spacing:.02em;color:#d9d6d1;white-space:nowrap}
.ab-ex span{display:block;font-size:4pt;line-height:1;letter-spacing:.26em;color:#E5262A;font-weight:700;margin-bottom:1.5mm}
/* kolleksiya */
.co{background:#17171a;color:#fff}
.co-l{position:absolute;left:0;top:0;width:70mm;height:148mm;padding:13mm 0 0 12mm}
.co-h{font-size:29pt;line-height:.98;font-weight:800;letter-spacing:-.025em;margin:3.4mm 0 5mm}
.co-h span{color:#E5262A;font-size:46pt;letter-spacing:-.035em}
.co-p{font-size:6.6pt;line-height:1.58;color:#bdb9b3;width:50mm}
.co-key{position:absolute;left:12mm;top:92mm;display:flex;align-items:center;gap:4mm}
.co-key p{font-size:5.6pt;line-height:1.5;color:#bdb9b3}
.nt-key{position:static;width:13mm;height:18mm;flex:none}
.nt-key s{margin-top:3.2mm;font-size:2.6pt}.nt-key b{font-size:9.2pt;margin-top:.9mm}.nt-key u{font-size:2.2pt;margin-top:.9mm}
.co-logo{position:absolute;left:12mm;bottom:11mm;width:20mm}
.co-g{position:absolute;left:72mm;top:10mm;width:128mm;display:grid;grid-template-columns:repeat(6,1fr);gap:3.2mm 1.6mm}
.cc img{width:100%;height:29.5mm;object-fit:cover}
.cc em{display:block;line-height:1;font-style:normal;font-size:4.1pt;font-weight:700;letter-spacing:.12em;color:#E5262A;margin-top:1.5mm}
.cc b{display:block;font-size:4.6pt;line-height:1.25;font-weight:700;letter-spacing:.06em;margin-top:.6mm;height:4.2mm}
.cc-r{background:#E5262A;height:29.5mm;padding:3mm 2.4mm;position:relative;grid-column:span 2}
.cc-r b{font-size:6.6pt;line-height:1.18;letter-spacing:0;font-weight:800;margin:0;height:auto}
.cc-r span{position:absolute;left:2.4mm;bottom:1.6mm;font-size:11pt;font-weight:600}
/* buyurtma */
.od-l{position:absolute;left:0;top:0;width:126mm;height:148mm;padding:13mm 0 0 12mm}
.olist{width:102mm}
.olist div{border-top:.25mm solid #cfc9c0;padding:3.9mm 0 3.9mm 13mm;position:relative}
.olist i{position:absolute;left:0;top:3.5mm;font-style:normal;color:#E5262A;font-size:12pt;font-weight:800}
.olist b{display:block;font-size:7.4pt;letter-spacing:.08em;font-weight:800;margin-bottom:1.1mm}
.olist p{font-size:6.5pt;line-height:1.5;color:#55514d}
.od-n{position:absolute;left:12mm;bottom:12mm;width:102mm;font-size:5.8pt;line-height:1.5;color:#77736e;border-left:.7mm solid #E5262A;padding-left:3mm}
.od-r{position:absolute;right:0;top:0;width:84mm;height:148mm}
.card{position:absolute;left:7mm;right:7mm;bottom:7mm;background:#17171a;color:#fff;padding:5mm}
.card b{display:block;font-size:10pt;font-weight:800;margin:2mm 0 1.6mm}
.card p{font-size:5.6pt;line-height:1.5;color:#c9c5bf}
.q{display:flex;align-items:center;gap:3.5mm;margin-top:3.5mm}
.q img{width:17mm;height:17mm;background:#fff;padding:.8mm}
.q span{font-size:7pt;font-weight:700}
.q em{font-style:normal;font-size:4.4pt;font-weight:600;color:#a9a5a0;letter-spacing:.2em}
/* kontaktlar */
.en-l{position:absolute;left:0;top:0;width:118mm;height:148mm;padding:11mm 0 0 12mm}
.en .fh{font-size:23pt;margin:3mm 0 4.2mm}
.en-main b{display:block;font-size:19pt;font-weight:800;letter-spacing:-.015em;line-height:1.1}
.en-main span{display:block;line-height:1;font-size:4.3pt;letter-spacing:.26em;color:#E5262A;font-weight:700;margin-top:1.3mm}
.ctl{width:94mm;margin-top:3.6mm}
.ctl div{display:flex;justify-content:space-between;align-items:baseline;border-top:.2mm solid #cfc9c0;padding:1.55mm 0}
.ctl b{font-size:8.2pt;font-weight:700}
.ctl span{line-height:1;font-size:4.2pt;letter-spacing:.26em;color:#8c8781;font-weight:600}
.qrs{position:absolute;left:12mm;bottom:11mm;display:flex;gap:4mm;width:94mm}
.qrs div{flex:1;background:#fff;padding:2.4mm 2.4mm 2.6mm}
.qrs img{width:17mm;height:17mm;margin:0 0 2mm -.6mm}
.qrs span{display:block;font-size:4pt;line-height:1;letter-spacing:.22em;color:#E5262A;font-weight:700}
.qrs b{display:block;font-size:5.6pt;font-weight:700;line-height:1;margin-top:1.3mm;white-space:nowrap}
.en-r{position:absolute;right:0;top:0;width:92mm;height:148mm}
.addr{position:absolute;left:7mm;right:7mm;bottom:7mm;background:#17171a;color:#fff;padding:4.5mm 5mm}
.addr span{display:block;font-size:4.4pt;letter-spacing:.3em;color:#E5262A;font-weight:700;margin-bottom:1.6mm}
.addr b{display:block;font-size:7.4pt;line-height:1.4;font-weight:600}
.addr em{display:block;font-style:normal;font-size:5.6pt;color:#bdb9b3;margin-top:1.8mm;letter-spacing:.06em}
/* orqa muqova */
.bk{background:#17171a;color:#fff}
.bk-c{position:absolute;left:14mm;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;gap:7mm}
.bk-logo{width:34mm}
.bk-t{font-size:15pt;font-weight:700;line-height:1.2;letter-spacing:-.01em}
.bk-l{display:flex;gap:5mm;font-size:6.5pt;letter-spacing:.14em;font-weight:600;color:#d9d6d1}
.bk-q{position:absolute;right:12mm;bottom:11mm;text-align:center}
.bk-q img{width:18mm;height:18mm;background:#fff;padding:1.2mm}
.bk-q span{display:block;font-size:4.4pt;letter-spacing:.22em;font-weight:600;margin-top:1.6mm;color:#d9d6d1}
.bk-f{position:absolute;left:14mm;bottom:11mm;font-size:4.2pt;letter-spacing:.3em;font-weight:600;color:#8c8781}
'''
if os.environ.get('COVERS'):
    open('/tmp/pdfw/p9/covers.html', 'w').write(f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>{cover_html("graphite")}{cover_html("light")}{cover_html("red")}</body></html>')
open('/tmp/pdfw/p9/pages9.html', 'w').write(f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>{cover}{about}{coll}{order}{contact}{back}{tabs}</body></html>')
open('/tmp/pdfw/p9/topdf.mjs', 'w').write(f"""import {{ chromium }} from '/home/claude/spsplast/node_modules/playwright/index.mjs';
const b = await chromium.launch({{ executablePath: '/opt/pw-browsers/chromium-1254/chrome-linux64/chrome' }});
const p = await b.newPage();
await p.goto('file:///tmp/pdfw/p9/pages9.html', {{ waitUntil: 'networkidle' }});
await p.evaluate(() => document.fonts.ready);
await p.pdf({{ path: '/tmp/pdfw/p9/pages9_{VAR}.pdf', width: '210mm', height: '148mm', printBackground: true, preferCSSPageSize: true }});
await b.close();
""")
subprocess.run(['node', '/tmp/pdfw/p9/topdf.mjs'], check=True)
print('pages9', VAR)
