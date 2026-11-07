/**
 * Zavod videosi (audit 2026-11-02, 3-bosqich: "ishonch dalillari", texnik
 * tayyorgarlik). `embedUrl` bo'lmasa (admin hali havola kiritmagan yoki havola
 * YouTube/Vimeo emas) — `null` qaytaradi, sahifada hech narsa ko'rinmaydi.
 */
export function FactoryVideo({ embedUrl, title }: { embedUrl: string | null; title: string }) {
  if (!embedUrl) return null;
  return (
    <section className="sec">
      <div className="wrap">
        <div style={{ position: 'relative', aspectRatio: '16 / 9', borderRadius: 'var(--radius-card)', overflow: 'hidden', background: 'var(--surface-ink)' }}>
          <iframe
            src={embedUrl}
            title={title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        </div>
      </div>
    </section>
  );
}
