import React from 'react';
import { Container } from '@/components/ui/Container';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="bg-surface-page min-h-screen py-8">
      <Container>
        <div className="space-y-6">
          <div className="h-12 bg-surface border border-line rounded-[20px] animate-pulse" />
          <div className="h-24 bg-surface border border-line rounded-[20px] animate-pulse" />
          <ProductGridSkeleton count={12} />
        </div>
      </Container>
    </div>
  );
}
