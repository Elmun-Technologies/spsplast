import Link from 'next/link';

/** Admin uchun yengil grafiklar (kutubxonasiz, server'da chiziladi). */

export function Kpi({ label, value, hint, href, alert }: { label: string; value: number | string; hint?: string; href?: string; alert?: boolean }) {
  const body = (
    <>
      <span>{label}</span>
      <b>{value}</b>
      {hint ? <small>{hint}</small> : null}
    </>
  );
  const cls = `adm-kpi${alert ? ' adm-kpi--alert' : ''}`;
  return href ? (
    <Link className={cls} href={href}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function Bars({ rows }: { rows: { label: string; n: number; href?: string }[] }) {
  if (!rows.length) return <p className="adm-empty">Hali ma'lumot yo'q.</p>;
  const max = Math.max(...rows.map((r) => r.n), 1);
  return (
    <ul className="adm-bars">
      {rows.map((r, i) => (
        <li key={`${r.label}-${i}`}>
          <span>{r.href ? <Link href={r.href}>{r.label}</Link> : r.label}</span>
          <b>{r.n}</b>
          <i aria-hidden="true">
            <s style={{ width: `${(r.n / max) * 100}%` }} />
          </i>
        </li>
      ))}
    </ul>
  );
}

/** Kunlik ustunli grafik: bo'sh kunlar ham 0 bilan ko'rsatiladi (Toshkent sanasi). */
export function DailyChart({ rows, days }: { rows: { day: string; value: number }[]; days: number }) {
  const map = new Map(rows.map((r) => [r.day, r.value]));
  const today = new Date(Date.now() + 5 * 3_600_000);
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date(today.getTime() - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10);
    return { day: d, value: map.get(d) ?? 0 };
  });
  const max = Math.max(...series.map((s) => s.value), 1);
  const total = series.reduce((a, s) => a + s.value, 0);
  const W = 100 / series.length;
  return (
    <figure className="adm-chart" aria-label={`Jami ${total}`}>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" role="img">
        {series.map((s, i) => {
          const h = (s.value / max) * 38;
          return (
            <rect key={s.day} x={i * W + W * 0.15} y={40 - h} width={W * 0.7} height={Math.max(h, 0.3)} rx={0.4}>
              <title>{`${s.day}: ${s.value}`}</title>
            </rect>
          );
        })}
      </svg>
      <figcaption>
        <span>{series[0]?.day.slice(5).split('-').reverse().join('.')}</span>
        <span>
          eng ko'p: <b>{max}</b> · jami: <b>{total}</b>
        </span>
        <span>bugun</span>
      </figcaption>
    </figure>
  );
}
