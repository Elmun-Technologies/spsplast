'use client';

import React from 'react';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-[#F1F3F5] relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
      </div>
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-100 rounded-full w-1/3" />
        <div className="h-4 bg-gray-100 rounded-full w-full" />
        <div className="h-4 bg-gray-100 rounded-full w-2/3" />
        <div className="pt-3 border-t border-gray-100 space-y-2">
          <div className="h-5 bg-gray-900/10 rounded-full w-1/2" />
          <div className="h-11 bg-gray-100 rounded-xl w-full" />
        </div>
      </div>
    </div>
  );
};

export const CategoryCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="space-y-2">
          <div className="h-4 bg-gray-100 rounded w-24" />
          <div className="h-3 bg-gray-100 rounded w-16" />
        </div>
        <div className="w-7 h-7 bg-gray-100 rounded-lg" />
      </div>
      <div className="aspect-[4/3] bg-[#F1F3F5] rounded-xl" />
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
