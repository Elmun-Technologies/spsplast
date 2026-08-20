import React from 'react';
import { db } from '@/lib/db';

export default async function AdminLeadsPage() {
  const leads = await db.lead.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">B2B va Konsultatsiya So‘rovlari</h1>
        <p className="text-xs text-gray-400 mt-1">Ulgurji narx so‘ragan mijozlar ro‘yxati</p>
      </div>

      <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-brand-dark text-gray-400 uppercase font-mono">
              <tr>
                <th className="p-4">Sana</th>
                <th className="p-4">Ism</th>
                <th className="p-4">Telefon</th>
                <th className="p-4">Kompaniya / Sex</th>
                <th className="p-4">Miqdor (dona)</th>
                <th className="p-4">Xabar / Izoh</th>
                <th className="p-4">Turi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {leads.map((l) => (
                <tr key={l.id} className="hover:bg-white/5">
                  <td className="p-4 text-[10px] text-gray-500 font-mono">
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4 font-bold text-white">{l.name}</td>
                  <td className="p-4 font-mono text-gray-200">{l.phone}</td>
                  <td className="p-4 font-medium text-brand-red">{l.company || '—'}</td>
                  <td className="p-4 font-bold text-white">{l.quantity || '—'}</td>
                  <td className="p-4 text-[11px] text-gray-300 max-w-xs">{l.message || '—'}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 text-[10px] font-bold">
                      {l.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
