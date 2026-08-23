'use client';

import React from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="bg-[#F8F9FA] min-h-screen py-16">
      <Container>
        <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-brand-red" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Xatolik yuz berdi</h2>
          <p className="text-sm text-gray-500">{error.message || 'Qayta urinib ko‘ring'}</p>
          <Button onClick={reset} className="w-full rounded-xl gap-2">
            <RefreshCw className="w-4 h-4" />
            Qayta yuklash
          </Button>
        </div>
      </Container>
    </div>
  );
}
