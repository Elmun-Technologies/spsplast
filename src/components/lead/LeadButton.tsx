'use client';

import React, { useState } from 'react';
import { Locale } from '@/lib/i18n';
import { LeadModal, LeadProduct } from './LeadModal';

/**
 * "Zayafka berish" tugmasi — har qanday sahifadan 1 klikda forma ochiladi.
 *
 * Mahsulot kartasi/sahifasi mahsulot kontekstini beradi; header va mobil
 * panelda esa mahsulotsiz (umumiy konsultatsiya) ochiladi.
 */
interface LeadButtonProps {
  lang: Locale;
  product?: LeadProduct;
  type?: 'PRODUCT_REQUEST' | 'B2B_WHOLESALE' | 'CONSULTATION';
  className?: string;
  children?: React.ReactNode;
  ariaLabel?: string;
}

export const LeadButton: React.FC<LeadButtonProps> = ({
  lang,
  product,
  type = 'PRODUCT_REQUEST',
  className,
  children,
  ariaLabel,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className} aria-label={ariaLabel}>
        {children}
      </button>
      {open && (
        <LeadModal isOpen onClose={() => setOpen(false)} lang={lang} product={product} type={type} />
      )}
    </>
  );
};
