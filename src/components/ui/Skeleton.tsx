'use client';

import React from 'react';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-surface rounded-[20px] border border-line overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-[#EDF1F6] relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
      </div>
      <div className="p-4 space-y-3">
        <div className="h-3 bg-surface-soft rounded-full w-1/3" />
        <div className="h-4 bg-surface-soft rounded-full w-full" />
        <div className="h-4 bg-surface-soft rounded-full w-2/3" />
        <div className="pt-3 border-t border-line-soft space-y-2">
          <div className="h-5 bg-[#DDE3EB] rounded-full w-1/2" />
          <div className="h-11 bg-surface-soft rounded-full w-full" />
        </div>
      </div>
    </div>
  );
};

export const CategoryCardSkeleton: React.FC = () => {
  return (
    <div className="bg-surface rounded-[20px] border border-line p-4 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="space-y-2">
          <div className="h-4 bg-surface-soft rounded w-24" />
          <div className="h-3 bg-surface-soft rounded w-16" />
        </div>
        <div className="w-7 h-7 bg-surface-soft rounded-lg" />
      </div>
      <div className="aspect-[4/3] bg-[#EDF1F6] rounded-[12px]" />
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};
