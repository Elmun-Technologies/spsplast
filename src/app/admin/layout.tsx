import type { Metadata } from 'next';
import './admin.css';

/** Admin panel: indekslanmaydi, ommaviy sayt header/footer'isiz. */
export const metadata: Metadata = {
  title: { default: 'SPS Admin', template: '%s · SPS Admin' },
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="adm">{children}</div>;
}
