import { settingValue } from './integrations.ts';

/**
 * Zavod videosi (audit 2026-11-02, 3-bosqich: "ishonch dalillari"). Admin kiritgan
 * havola to'g'ridan-to'g'ri iframe `src`ga yozilmaydi — faqat YouTube/Vimeo
 * ID'si ajratib olinadi va O'ZIMIZ qurgan, bilingan `/embed/` manzili ishlatiladi
 * (admin hisobi buzilsa ham ixtiyoriy manzilga iframe ochib bo'lmaydi).
 */
export function factoryVideoEmbedUrl(): string | null {
  const url = settingValue('factory_video_url');
  if (!url) return null;
  let m = url.match(/youtube\.com\/watch\?v=([\w-]+)/) || url.match(/youtu\.be\/([\w-]+)/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  m = url.match(/(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}`;
  return null;
}
