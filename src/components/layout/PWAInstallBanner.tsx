'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem('pwa-dismissed');
      if (!dismissed) setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa-dismissed', '1');
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-24 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 z-40 max-w-sm bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-4 flex items-start gap-3 animate-in slide-in-from-bottom-2">
      <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shrink-0">
        <Smartphone className="w-6 h-6 text-brand-red" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-bold text-white">Ilovani o'rnating</div>
        <div className="text-xs text-gray-400 mt-1 leading-relaxed">SPS Plast ni tezroq ochish va offline savat uchun PWA o'rnating</div>
        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={handleInstall} className="rounded-xl gap-1.5">
            <Download className="w-4 h-4" />
            O'rnatish
          </Button>
          <Button size="sm" variant="secondary" onClick={handleDismiss} className="rounded-xl bg-white/10 text-white border-white/20 hover:bg-white/15">
            Keyinroq
          </Button>
        </div>
      </div>
      <button onClick={handleDismiss} className="p-1 text-gray-400 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
