'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
      />

      <div
        className={cn(
          'relative w-full bg-surface rounded-[18px] border border-line shadow-card p-5 shadow-lg z-10 text-ink animate-in fade-in zoom-in-95 duration-200',
          widthClasses[maxWidth]
        )}
      >
        <div className="flex items-center justify-between pb-3 border-b border-line-soft mb-4">
          {title && <h3 className="text-base font-bold text-ink">{title}</h3>}
          <button
            onClick={onClose}
            className="p-2 rounded-full text-ink-sub hover:text-ink hover:bg-surface-soft transition-colors ml-auto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
};
