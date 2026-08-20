'use client';

import React from 'react';
import { ImageOff } from 'lucide-react';

interface PlaceholderImageProps {
    className?: string;
    textUz?: string;
    textRu?: string;
    lang?: string;
}

export const PlaceholderImage: React.FC<PlaceholderImageProps> = ({
    className = '',
    textUz = 'Rasm tez orada',
    textRu = 'Изображение скоро появится',
    lang = 'uz',
}) => {
    const label = lang === 'ru' ? textRu : textUz;

    return (
        <div
            className={`w-full h-full min-h-[140px] bg-brand-dark/80 border border-brand-border/60 rounded-xl flex flex-col items-center justify-center p-4 text-gray-500 select-none ${className}`}
        >
            <div className="w-10 h-10 rounded-full bg-brand-card flex items-center justify-center border border-brand-border mb-2 text-brand-red">
                <ImageOff className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-medium tracking-wide uppercase text-gray-400 text-center">
                SPS PLAST
            </span>
            <span className="text-[10px] text-gray-500 text-center mt-0.5">
                {label}
            </span>
        </div>
    );
};
