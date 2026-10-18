import { LEAD_STATUSES, LEAD_TYPES, type LeadStatus } from '@/server/db/schema';
import type { LeadFilters } from '@/server/leads';

export type LeadSearch = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || '';

/** URL query → `listLeads` filtri (ro'yxat sahifasi va CSV eksport bir xil o'qiydi). */
export function parseLeadSearch(sp: LeadSearch): LeadFilters {
  const status = one(sp.status);
  const type = one(sp.type);
  const assignee = one(sp.assignee);
  const day = (v: string, add = 0) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
    // Sana Toshkent vaqtida: 00:00 UTC+5.
    const d = new Date(`${v}T00:00:00+05:00`);
    return new Date(d.getTime() + add * 86_400_000);
  };
  return {
    status: (LEAD_STATUSES as readonly string[]).includes(status) ? (status as LeadStatus) : undefined,
    type: (LEAD_TYPES as readonly string[]).includes(type) ? (type as LeadFilters['type']) : undefined,
    assigneeId: assignee === 'none' ? 'none' : Number(assignee) > 0 ? Number(assignee) : undefined,
    q: one(sp.q).slice(0, 100) || undefined,
    from: day(one(sp.from)),
    to: day(one(sp.to), 1),
    undelivered: one(sp.tg) === '0' || undefined,
    page: Math.max(1, Number(one(sp.page)) || 1),
  };
}

/** Joriy filtrni saqlab, bitta parametrni almashtirgan havola. */
export function withParam(sp: LeadSearch, key: string, value: string | null): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const val = one(v);
    if (val && k !== key && k !== 'page') p.set(k, val);
  }
  if (value) p.set(key, value);
  const s = p.toString();
  return s ? `?${s}` : '?';
}
