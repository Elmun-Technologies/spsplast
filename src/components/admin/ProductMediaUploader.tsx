'use client';

import React, { useState, useRef } from 'react';
import { Upload, ArrowRight, Loader2, Link as LinkIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface MediaItem {
    id?: string;
    type: string;
    url: string;
    alt?: string;
    storageKey?: string;
    mimeType?: string;
    width?: number;
    height?: number;
    sizeBytes?: number;
}

interface ProductMediaUploaderProps {
    productId?: string;
    media: MediaItem[];
    onChange: (updatedMedia: MediaItem[]) => void;
}

export const MEDIA_ROLE_LABELS: Record<string, string> = {
    MAIN: 'Asosiy rasm',
    GALLERY: 'Galereya',
    DIMENSION: 'O‘lcham',
    DETAIL: 'Detal',
    USAGE: 'Ishlatilish',
    MOLD: 'Qolip',
    FINISHED_RESULT: 'Tayyor natija',
    VIDEO: 'Video',
};

export function ProductMediaUploader({ productId, media, onChange }: ProductMediaUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [addUrlInput, setAddUrlInput] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('GALLERY');
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const moldInputRef = useRef<HTMLInputElement>(null);
    const resultInputRef = useRef<HTMLInputElement>(null);

    const moldMedia = media.find((m) => m.type === 'MOLD');
    const resultMedia = media.find((m) => m.type === 'FINISHED_RESULT');

    const uploadFile = async (file: File, role: string, replaceMediaId?: string) => {
        setUploading(true);
        setUploadProgress(`Yuklanmoqda: ${file.name}...`);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', role);
            formData.append('folder', 'products');
            if (productId) formData.append('productId', productId);
            if (replaceMediaId) formData.append('replaceMediaId', replaceMediaId);

            const res = await fetch('/api/admin/media/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Fayl yuklashda xatolik');

            const newMediaItem: MediaItem = {
                id: data.media?.id || undefined,
                type: role,
                url: data.url,
                storageKey: data.key,
                mimeType: file.type,
                width: data.width,
                height: data.height,
                sizeBytes: data.sizeBytes,
            };

            let updatedList = [...media];
            if (role === 'MAIN') updatedList = updatedList.map((m) => (m.type === 'MAIN' ? { ...m, type: 'GALLERY' } : m));
            if (replaceMediaId) updatedList = updatedList.filter((m) => m.id !== replaceMediaId);
            else if (role === 'MOLD' && moldMedia) updatedList = updatedList.filter((m) => m.type !== 'MOLD');
            else if (role === 'FINISHED_RESULT' && resultMedia) updatedList = updatedList.filter((m) => m.type !== 'FINISHED_RESULT');

            updatedList.push(newMediaItem);
            onChange(updatedList);
            setUploadProgress(null);
        } catch (err: any) {
            setError(err.message || 'Yuklashda xatolik');
        } finally {
            setUploading(false);
        }
    };

    const handleFilesSelected = async (files: FileList | null, role: string = selectedRole) => {
        if (!files || files.length === 0) return;
        for (let i = 0; i < files.length; i++) await uploadFile(files[i], role);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.length) await handleFilesSelected(e.dataTransfer.files, selectedRole);
    };

    const handleAddByUrl = () => {
        if (!addUrlInput.trim()) return;
        const url = addUrlInput.trim();
        let updatedList = [...media];
        if (selectedRole === 'MAIN') updatedList = updatedList.map((m) => (m.type === 'MAIN' ? { ...m, type: 'GALLERY' } : m));
        updatedList.push({ type: selectedRole, url, alt: '' });
        onChange(updatedList);
        setAddUrlInput('');
    };

    const handleRemove = async (index: number) => {
        const itemToRemove = media[index];
        const updatedList = media.filter((_, i) => i !== index);
        onChange(updatedList);
        if (productId && itemToRemove.id) {
            try {
                await fetch(`/api/admin/products/${productId}/media?mediaId=${itemToRemove.id}`, { method: 'DELETE' });
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleSetMain = (index: number) => {
        const updated = media.map((m, i) => {
            if (i === index) return { ...m, type: 'MAIN' };
            if (m.type === 'MAIN') return { ...m, type: 'GALLERY' };
            return m;
        });
        onChange(updated);
    };

    const moveItem = (from: number, to: number) => {
        if (to < 0 || to >= media.length) return;
        const updated = [...media];
        const [moved] = updated.splice(from, 1);
        updated.splice(to, 0, moved);
        onChange(updated);
    };

    return (
        <div className="space-y-6">
            <div className="p-4 rounded-xl bg-[#161920] border border-[#2A2F3A] space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Qolip va tayyor natija</span>
                    <span className="text-[10px] text-gray-400 font-normal">(MOLD → FINISHED_RESULT)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-300">Qolip rasmi</span>
                            <Button type="button" size="sm" variant="ghost" onClick={() => moldInputRef.current?.click()} disabled={uploading} className="gap-1 text-xs">
                                <Upload className="w-3.5 h-3.5" />
                                <span>{moldMedia ? 'Almashtirish' : 'Yuklash'}</span>
                            </Button>
                            <input ref={moldInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFilesSelected(e.target.files, 'MOLD')} />
                        </div>
                        <div className="aspect-video relative rounded-xl border border-dashed border-[#2A2F3A] bg-[#1E222A] overflow-hidden flex items-center justify-center">
                            {moldMedia ? <img src={moldMedia.url} alt="Qolip" className="w-full h-full object-cover" /> : <div className="text-center p-3 text-gray-500 text-xs">Qolip rasmi yuklanmagan</div>}
                        </div>
                    </div>

                    <div className="hidden md:flex justify-center text-brand-red">
                        <ArrowRight className="w-6 h-6" />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-300">Tayyor mahsulot rasmi</span>
                            <Button type="button" size="sm" variant="ghost" onClick={() => resultInputRef.current?.click()} disabled={uploading} className="gap-1 text-xs">
                                <Upload className="w-3.5 h-3.5" />
                                <span>{resultMedia ? 'Almashtirish' : 'Yuklash'}</span>
                            </Button>
                            <input ref={resultInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFilesSelected(e.target.files, 'FINISHED_RESULT')} />
                        </div>
                        <div className="aspect-video relative rounded-xl border border-dashed border-[#2A2F3A] bg-[#1E222A] overflow-hidden flex items-center justify-center">
                            {resultMedia ? <img src={resultMedia.url} alt="Tayyor natija" className="w-full h-full object-cover" /> : <div className="text-center p-3 text-gray-500 text-xs">Tayyor natija rasmi yuklanmagan</div>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="text-sm font-semibold text-gray-300">Galereya va boshqa medialar</label>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Rol:</span>
                        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="bg-[#161920] border border-[#2A2F3A] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-red">
                            {Object.entries(MEDIA_ROLE_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${dragOver ? 'border-brand-red bg-brand-red/10' : 'border-[#2A2F3A] hover:border-brand-red/50 bg-[#1E222A]/50'}`}
                >
                    <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFilesSelected(e.target.files)} />
                    <div className="flex flex-col items-center gap-2">
                        {uploading ? <Loader2 className="w-8 h-8 text-brand-red animate-spin" /> : <Upload className="w-8 h-8 text-gray-400" />}
                        <p className="text-sm font-medium text-white">{uploading ? uploadProgress : 'Rasm yuklash uchun bosing yoki shu yerga tashlang'}</p>
                        <p className="text-xs text-gray-400">JPG, PNG, WebP, AVIF (Maks. 10MB) — ko'p fayl birdaniga</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="url" value={addUrlInput} onChange={(e) => setAddUrlInput(e.target.value)} placeholder="Yoki rasm URL manzilini kiriting..." className="w-full bg-[#161920] border border-[#2A2F3A] rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red" />
                    </div>
                    <Button type="button" size="sm" variant="secondary" onClick={handleAddByUrl} className="rounded-xl">
                        URL qo'shish
                    </Button>
                </div>

                {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium">{error}</div>}
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">Barcha yuklangan fayllar ({media.length}) — sudrab tartiblang</h4>
                    <span className="text-xs text-gray-500">Drag & Drop + ↑↓</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {media.map((m, idx) => (
                        <div
                            key={`${m.url}-${idx}`}
                            draggable
                            onDragStart={() => setDraggedIdx(idx)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                if (draggedIdx !== null) {
                                    moveItem(draggedIdx, idx);
                                    setDraggedIdx(null);
                                }
                            }}
                            className={`relative group bg-[#161920] border rounded-xl overflow-hidden cursor-move transition-all ${draggedIdx === idx ? 'opacity-40 border-brand-red' : 'border-[#2A2F3A] hover:border-gray-600'}`}
                        >
                            <div className="aspect-square relative">
                                <img src={m.url} alt={m.alt || ''} className="w-full h-full object-cover" />
                                <div className="absolute top-2 left-2 flex gap-1">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/80 text-white border border-white/10">{MEDIA_ROLE_LABELS[m.type] || m.type}</span>
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-900 text-gray-300 border border-gray-700">#{idx + 1}</span>
                                </div>

                                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                    <div className="flex gap-1">
                                        <button type="button" onClick={() => moveItem(idx, idx - 1)} disabled={idx === 0} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center disabled:opacity-30">
                                            ↑
                                        </button>
                                        <button type="button" onClick={() => moveItem(idx, idx + 1)} disabled={idx === media.length - 1} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center disabled:opacity-30">
                                            ↓
                                        </button>
                                    </div>
                                    <div className="flex gap-1.5">
                                        {m.type !== 'MAIN' && (
                                            <button type="button" onClick={() => handleSetMain(idx)} className="px-3 py-1 rounded-full bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold">
                                                Asosiy
                                            </button>
                                        )}
                                        <button type="button" onClick={() => handleRemove(idx)} className="px-3 py-1 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1">
                                            <Trash2 className="w-3 h-3" />
                                            O'chirish
                                        </button>
                                    </div>
                                </div>

                                {m.type === 'MAIN' && <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded-full bg-brand-red text-white text-xs font-bold text-center">ASOSIY RASM</div>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
