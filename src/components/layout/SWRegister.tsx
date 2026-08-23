'use client';

import { useEffect } from 'react';

export const SWRegister: React.FC = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  return null;
};
