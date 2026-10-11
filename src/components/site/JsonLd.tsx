import type { JsonLdValue } from '@/lib/seo';

/**
 * JSON-LD bloki (HANDOFF 7: Organization, Product, BreadcrumbList, FAQPage).
 * Server komponent — mijozga JS yubormaydi, faqat `<script>` matni.
 */
export function JsonLd({ data }: { data: JsonLdValue | JsonLdValue[] }) {
  const blocks = Array.isArray(data) ? data : [data];
  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={`${block['@type'] as string}-${i}`}
          type="application/ld+json"
          // JSON-LD statik ma'lumotdan yig'iladi (foydalanuvchi kiritgan matn yo'q);
          // baribir `<`/`>` belgilari escape qilinadi.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block).replace(/</g, '\\u003c') }}
        />
      ))}
    </>
  );
}
