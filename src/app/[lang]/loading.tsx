import React from 'react';
import { Container } from '@/components/ui/Container';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="bg-[#F8F9FA] min-h-screen py-8">
      <Container>
        <div className="space-y-6">
          <div className="h-12 bg-white border border-gray-200 rounded-2xl animate-pulse" />
          <div className="h-24 bg-white border border-gray-200 rounded-2xl animate-pulse" />
          <ProductGridSkeleton count={12} />
        </div>
      </Container>
    </div>
  );
}
