# 2026-11-26 (2): muqova foni — rasmsiz, tipografik (egasi: qolip+natija shart emas). Qolip naqshi (saytdagi girih) chapdan o'ngga quyuqlashadi.
import numpy as np
from PIL import Image
T = {'graphite': ((23, 23, 26), (255, 255, 255), .115), 'light': ((238, 234, 228), (23, 23, 26), .075), 'red': ((215, 38, 46), (255, 255, 255), .13)}
tile = Image.open('/home/claude/spsplast/public/images/site/patterns/girih.webp').convert('RGBA').getchannel('A')
for var, dpi in (('web', 170), ('max', 300)):
    W, H = round(210 / 25.4 * dpi), round(148 / 25.4 * dpi); ts = round(30 / 25.4 * dpi)
    t = np.asarray(tile.resize((ts, ts), Image.LANCZOS), np.float32) / 255
    a = np.tile(t, (H // ts + 2, W // ts + 2))[:H, :W]
    x = np.linspace(0, 1, W)[None, :]; y = np.linspace(0, 1, H)[:, None]
    fade = np.clip((x - .30) / .55, 0, 1) ** 1.25 * (1 - .35 * y)          # chap (matn) tomonda naqsh yo'q
    for name, (bg, fg, op) in T.items():
        k = (a * fade * op)[..., None]
        im = np.array(bg, np.float32) * (1 - k) + np.array(fg, np.float32) * k
        Image.fromarray(im.clip(0, 255).astype(np.uint8)).save(f'{var}/covbg-{name}.jpg', quality=93 if var == 'max' else 88, subsampling=0)
print('covbg ok')
