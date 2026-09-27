'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { Locale } from '@/lib/i18n';

export interface ProductOptionValue {
  code: string;
  label: string;
  note?: string | null;
}

export interface ProductOptionGroup {
  code: string;
  name: string;
  values: ProductOptionValue[];
}

interface ProductOptionsProps {
  groups: ProductOptionGroup[];
  selected: Record<string, string>;
  onSelect: (groupCode: string, valueCode: string) => void;
  lang: Locale;
  /** SKU of the variant the current selection resolves to. */
  variantSku?: string | null;
}

/**
 * Variant option picker (material / plastic thickness / …).
 *
 * The groups come from the product's `ProductVariant.options` — i.e. only
 * options that really exist in the catalogue are rendered. A product without
 * variants renders nothing.
 */
export const ProductOptions: React.FC<ProductOptionsProps> = ({
  groups,
  selected,
  onSelect,
  lang,
  variantSku,
}) => {
  if (!groups || groups.length === 0) return null;

  return (
    <div className="rounded-[20px] bg-surface-soft p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-line">
        <h4 className="font-semibold text-ink text-[15px]">
          {lang === 'ru' ? 'Опции формы' : 'Qolip opsiyalari'}
        </h4>
        {variantSku && (
          <span className="font-mono text-[11px] text-ink-sub bg-surface px-2.5 py-1 rounded-full border border-line">
            {variantSku}
          </span>
        )}
      </div>

      {groups.map((group) => (
        <div key={group.code} className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-ink-sub">{group.name}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {group.values.map((value) => {
              const active = selected[group.code] === value.code;
              return (
                <button
                  key={value.code}
                  type="button"
                  onClick={() => onSelect(group.code, value.code)}
                  aria-pressed={active}
                  className={`text-left px-4 py-3 rounded-[16px] border transition-all min-h-[52px] ${
                    active
                      ? 'border-brand-red bg-surface shadow-card'
                      : 'border-line bg-surface hover:border-ink-sub'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        active ? 'border-brand-red bg-brand-red' : 'border-line'
                      }`}
                    >
                      {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </span>
                    <span className="text-sm font-semibold text-ink">{value.label}</span>
                  </span>
                  {value.note && (
                    <span className="block text-[11px] text-ink-sub mt-1 pl-6 leading-snug">{value.note}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
