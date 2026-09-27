'use client';

import React from 'react';

export interface AxisOption {
  id: string;
  code: string;
  translations: Array<{ locale: string; label: string }>;
}

export interface AxisAttribute {
  id: string;
  code: string;
  variantAxis: boolean;
  translations: Array<{ locale: string; name: string }>;
  options: AxisOption[];
}

export interface VariantFormValues {
  sku: string;
  price: string;
  compareAtPrice: string;
  stockQty: string;
  status: string;
  /** attributeId -> optionId */
  optionIds: Record<string, string>;
}

interface VariantFormProps {
  axes: AxisAttribute[];
  values: VariantFormValues;
  onChange: (values: VariantFormValues) => void;
}

const input =
  'w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-red-500';
const label = 'block text-xs font-semibold text-gray-400 mb-1.5';

function labelOf(translations: Array<{ locale: string; label?: string; name?: string }>, fallback: string) {
  const uz = translations.find((t) => t.locale === 'uz');
  return uz?.label || uz?.name || translations[0]?.label || translations[0]?.name || fallback;
}

/**
 * Variant maydonlari — create va edit sahifalari uchun umumiy forma.
 * Opsiya o'qlari (`variantAxis: true` atributlar) bazadan keladi, shuning uchun
 * bu yerda hech qanday qattiq yozilgan ro'yxat yo'q.
 */
export const VariantForm: React.FC<VariantFormProps> = ({ axes, values, onChange }) => {
  const set = (patch: Partial<VariantFormValues>) => onChange({ ...values, ...patch });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>SKU *</label>
          <input
            className={input}
            value={values.sku}
            onChange={(e) => set({ sku: e.target.value })}
            placeholder="SPS-26-PNL-01-PP-T20"
            required
          />
        </div>
        <div>
          <label className={label}>Holati</label>
          <select className={input} value={values.status} onChange={(e) => set({ status: e.target.value })}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DRAFT">DRAFT</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
        <div>
          <label className={label}>Narx (UZS) — 0 = «Narx so‘rash»</label>
          <input
            type="number"
            min="0"
            className={input}
            value={values.price}
            onChange={(e) => set({ price: e.target.value })}
          />
        </div>
        <div>
          <label className={label}>Eski narx (ixtiyoriy)</label>
          <input
            type="number"
            min="0"
            className={input}
            value={values.compareAtPrice}
            onChange={(e) => set({ compareAtPrice: e.target.value })}
          />
        </div>
        <div>
          <label className={label}>Ombordagi soni</label>
          <input
            type="number"
            min="0"
            className={input}
            value={values.stockQty}
            onChange={(e) => set({ stockQty: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Opsiyalar</div>

        {axes.length === 0 ? (
          <p className="text-sm text-gray-500">
            Variant o‘qi (variantAxis) belgilangan atribut topilmadi. Avval{' '}
            <span className="text-gray-300">Atributlar</span> bo‘limida atributni variant o‘qi sifatida belgilang.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {axes.map((axis) => (
              <div key={axis.id}>
                <label className={label}>{labelOf(axis.translations, axis.code)}</label>
                <select
                  className={input}
                  value={values.optionIds[axis.id] || ''}
                  onChange={(e) => set({ optionIds: { ...values.optionIds, [axis.id]: e.target.value } })}
                >
                  <option value="">— tanlanmagan —</option>
                  {axis.options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {labelOf(option.translations, option.code)}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
