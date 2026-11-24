/**
 * Rasm burchagidagi lupa tugmasi (klaviatura va ko'zga ko'rinadigan belgi uchun). O'zi hech narsa qilmaydi —
 * bosish `data-zoom` li ota elementga ko'tariladi va `ZoomLayer` ushlaydi. Server komponentlarda ham ishlaydi.
 */
export function ZoomButton({ label }: { label: string }) {
  return (
    <button type="button" className="zoom-btn" data-zoom-btn aria-label={label} title={label}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path d="M16 16l4.5 4.5M11 8.5v5M8.5 11h5" />
      </svg>
    </button>
  );
}
