'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Plus, Tag, Edit, Trash2, ChevronDown, ChevronUp, Settings } from 'lucide-react';

interface Attribute {
  id: string;
  code: string;
  type: string;
  unit: string | null;
  filterable: boolean;
  searchable: boolean;
  variantAxis: boolean;
  sortOrder: number;
  translations: Array<{ locale: string; name: string }>;
  options?: Array<{
    id: string;
    code: string;
    sortOrder: number;
    translations: Array<{ locale: string; label: string }>;
  }>;
  _count?: { categories: number; values: number };
}

export default function AdminAttributesPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    try {
      const res = await fetch('/api/attributes?locale=uz');
      const data = await res.json();
      setAttributes(data.attributes || []);
    } catch (error) {
      console.error('Atributlarni yuklashda xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu atributni o\'chirishni xohlaysizmi?')) return;

    try {
      const res = await fetch(`/api/attributes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAttributes();
      } else {
        const data = await res.json();
        alert(data.error || 'O\'chirishda xatolik');
      }
    } catch (error) {
      alert('Server xatosi');
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      TEXT: 'Matn',
      NUMBER: 'Raqam',
      BOOLEAN: 'Ha/Yo\'q',
      SELECT: 'Tanlov',
      MULTISELECT: 'Ko\'p tanlov',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Atributlar</h1>
          <p className="text-xs text-gray-400 mt-1">
            Mahsulot xususiyatlari va variant o'qlari ({attributes.length} ta)
          </p>
        </div>

        <Link href="/admin/attributes/create">
          <Button className="gap-2 font-bold">
            <Plus className="w-4 h-4" />
            <span>Yangi Atribut</span>
          </Button>
        </Link>
      </div>

      <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
        {attributes.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Atributlar topilmadi. Yangi atribut yarating.
          </div>
        ) : (
          <div className="divide-y divide-brand-border">
            {attributes.map((attr) => {
              const nameUz = attr.translations.find((t) => t.locale === 'uz')?.name || attr.code;
              const isExpanded = expandedId === attr.id;

              return (
                <div key={attr.id}>
                  <div
                    className="flex items-center justify-between p-4 hover:bg-white/5 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : attr.id)}
                  >
                    <div className="flex items-center gap-4">
                      <Tag className="w-5 h-5 text-pink-400" />
                      <div>
                        <p className="font-bold text-white">{nameUz}</p>
                        <p className="text-[10px] text-gray-500 font-mono">
                          {attr.code} · {getTypeLabel(attr.type)}
                          {attr.unit && ` (${attr.unit})`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {attr.variantAxis && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                          Variant o'qi
                        </span>
                      )}
                      {attr.filterable && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                          Filter
                        </span>
                      )}
                      <span className="text-[10px] text-gray-500">
                        {attr._count?.categories || 0} kategoriya
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && attr.options && attr.options.length > 0 && (
                    <div className="px-4 pb-4 ml-9 space-y-2">
                      <p className="text-[10px] text-gray-400 font-semibold mb-2">Variantlar:</p>
                      <div className="flex flex-wrap gap-2">
                        {attr.options.map((opt) => {
                          const labelUz = opt.translations.find((t) => t.locale === 'uz')?.label || opt.code;
                          return (
                            <span
                              key={opt.id}
                              className="px-2 py-1 rounded-lg bg-brand-dark border border-brand-border text-xs text-gray-300"
                            >
                              {labelUz}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
