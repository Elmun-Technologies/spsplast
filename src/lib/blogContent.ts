/**
 * Blog matnini sahifa bloklariga ajratuvchi mini-parser.
 *
 * Nega butun markdown kutubxonasi emas: maqola matni faqat to'rtta elementdan
 * foydalanadi (sarlavha, kichik sarlavha, ro'yxat, iqtibos). Kutubxona
 * qo'shilsa bundle kattalashadi va XSS sozlamalarini alohida sozlash kerak
 * bo'lardi — bu yerda esa matn faqat matn sifatida chiqadi (React o'zi
 * ekranlaydi).
 *
 * Format:
 *   "## Sarlavha"  → h2
 *   "### Sarlavha" → h3
 *   "- element"    → ro'yxat (ketma-ket satrlar bitta ro'yxatga yig'iladi)
 *   "> iqtibos"    → ajratilgan blok
 *   qolgan satrlar → paragraf; bloklar bo'sh qator bilan ajratiladi.
 *
 * Diqqat: ro'yxat paragrafga yopishib yozilgan bo'lishi mumkin
 * ("...quyidagilar:" dan keyingi satr "- " bilan boshlanadi), shuning uchun
 * ajratish satr darajasida bajariladi — blokning hammasi bir turdagi
 * bo'lishini talab qilmaymiz.
 */

export type BlogBlock =
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'quote'; text: string }
  | { kind: 'ul'; items: string[] };

export function parseContent(content: string): BlogBlock[] {
  const blocks: BlogBlock[] = [];

  for (const chunk of content.split(/\n{2,}/)) {
    const lines = chunk
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    let paragraph: string[] = [];
    let items: string[] = [];

    const flushParagraph = () => {
      if (paragraph.length > 0) {
        blocks.push({ kind: 'p', text: paragraph.join(' ') });
        paragraph = [];
      }
    };
    const flushItems = () => {
      if (items.length > 0) {
        blocks.push({ kind: 'ul', items });
        items = [];
      }
    };

    for (const line of lines) {
      if (line.startsWith('- ')) {
        flushParagraph();
        items.push(line.slice(2));
        continue;
      }

      flushItems();

      if (line.startsWith('### ')) {
        flushParagraph();
        blocks.push({ kind: 'h3', text: line.slice(4) });
      } else if (line.startsWith('## ')) {
        flushParagraph();
        blocks.push({ kind: 'h2', text: line.slice(3) });
      } else if (line.startsWith('> ')) {
        flushParagraph();
        blocks.push({ kind: 'quote', text: line.slice(2) });
      } else {
        paragraph.push(line);
      }
    }

    flushItems();
    flushParagraph();
  }

  return blocks;
}
