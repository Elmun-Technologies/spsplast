/**
 * Admin → SEO tahrirlash: saytda hozir chiqayotgan title/description/H1 (o'z saytimizdan
 * o'qiladi — standart matn sahifa kodida yig'iladi, shuning uchun eng aniq manba shu).
 */
export type LiveMeta = { title: string; description: string; h1: string };

const decode = (s: string) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

export function parseMeta(html: string): LiveMeta {
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '';
  const desc = /<meta[^>]+name="description"[^>]+content="([^"]*)"/i.exec(html)?.[1] ?? '';
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1] ?? '';
  return { title: decode(title), description: decode(desc), h1: decode(h1) };
}

export async function fetchLiveMeta(origin: string, url: string, f: typeof fetch = fetch): Promise<LiveMeta | null> {
  try {
    const res = await f(`${origin}${url}`, { signal: AbortSignal.timeout(6000), cache: 'no-store', headers: { 'user-agent': 'SPS-Admin-SEO' } });
    if (!res.ok) return null;
    return parseMeta(await res.text());
  } catch {
    return null;
  }
}
