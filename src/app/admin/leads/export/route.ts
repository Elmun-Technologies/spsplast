import { requireUser } from '@/server/session';
import { listLeads } from '@/server/leads';
import { parseLeadSearch } from '../../filters';
import { CLIENT_LABEL, STATUS_LABEL, TYPE_LABEL, countryName, formatDate } from '../../labels';

/**
 * Joriy filtr bo'yicha zayafkalar CSV'da (Excel: UTF-8 BOM + `;`).
 * `/api` ostida emas — sessiya cookie'si `/admin` yo'liga bog'langan.
 */
export const dynamic = 'force-dynamic';

const MAX_ROWS = 10_000;

function cell(v: unknown): string {
  const s = v == null ? '' : String(v);
  // Formula injection'dan himoya (=, +, -, @ bilan boshlangan qiymat).
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export async function GET(req: Request) {
  const { db } = await requireUser();
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const f = parseLeadSearch(sp);

  const header = ['Raqam', 'Sana', 'Holat', 'Turi', 'Mijoz turi', 'Ism', 'Telefon', 'Davlat', 'Shahar', 'Kompaniya', 'm²/kun', 'Modellar', "Mas'ul", 'Manba', 'Til'];
  const lines = [header.map(cell).join(';')];
  for (let page = 1; page <= MAX_ROWS / 200; page += 1) {
    const res = await listLeads(db, { ...f, page, pageSize: 200 });
    for (const l of res.rows) {
      lines.push(
        [
          l.number,
          formatDate(l.createdAt),
          STATUS_LABEL[l.status],
          TYPE_LABEL[l.type],
          l.clientType ? CLIENT_LABEL[l.clientType] : '',
          l.name,
          l.phone,
          countryName(l.country || l.geoCountry),
          l.city,
          l.company,
          l.volumeM2,
          l.itemCount,
          l.assigneeName,
          l.utmSource,
          l.lang,
        ]
          .map(cell)
          .join(';'),
      );
    }
    if (page >= res.pages) break;
  }

  const date = new Date().toISOString().slice(0, 10);
  return new Response(`﻿${lines.join('\r\n')}\r\n`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="sps-zayafkalar-${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
