'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Check, Image as ImageIcon, ArrowRight, Loader2, Link as LinkIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface MediaItem {
    id?: string;
    type: string; // MAIN, GALLERY, MOLD, FINISHED_RESULT, DIMENSION, DETAIL, USAGE, VIDEO
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
            if (!res.ok) {
                throw new Error(data.error || 'Fayl yuklashda xatolik yuz berdi');
            }

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

            // Handle MAIN uniqueness
            if (role === 'MAIN') {
                updatedList = updatedList.map((m) => (m.type === 'MAIN' ? { ...m, type: 'GALLERY' } : m));
            }

            // Handle replacement if explicit replaceMediaId or role-based singleton like MOLD/FINISHED_RESULT
            if (replaceMediaId) {
                updatedList = updatedList.filter((m) => m.id !== replaceMediaId);
            } else if (role === 'MOLD' && moldMedia) {
                updatedList = updatedList.filter((m) => m.type !== 'MOLD');
            } else if (role === 'FINISHED_RESULT' && resultMedia) {
                updatedList = updatedList.filter((m) => m.type !== 'FINISHED_RESULT');
            }

            updatedList.push(newMediaItem);
            onChange(updatedList);
            setUploadProgress(null);
        } catch (err: any) {
            setError(err.message || 'Yuklashda xatolik yuz berdi');
        } finally {
            setUploading(false);
        }
    };

    const handleFilesSelected = async (files: FileList | null, role: string = selectedRole) => {
        if (!files || files.length === 0) return;
        for (let i = 0; i < files.length; i++) {
            await uploadFile(files[i], role);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await handleFilesSelected(e.dataTransfer.files, selectedRole);
        }
    };

    const handleAddByUrl = () => {
        if (!addUrlInput.trim()) return;
        const url = addUrlInput.trim();

        let updatedList = [...media];
        if (selectedRole === 'MAIN') {
            updatedList = updatedList.map((m) => (m.type === 'MAIN' ? { ...m, type: 'GALLERY' } : m));
        }

        updatedList.push({
            type: selectedRole,
            url,
            alt: '',
        });

        onChange(updatedList);
        setAddUrlInput('');
    };

    const handleRemove = async (index: number) => {
        const itemToRemove = media[index];
        const updatedList = media.filter((_, i) => i !== index);
        onChange(updatedList);

        // If item has ID and exists on server, fire API delete call
        if (productId && itemToRemove.id) {
            try {
                await fetch(`/api/admin/products/${productId}/media?mediaId=${itemToRemove.id}`, {
                    method: 'DELETE',
                });
            } catch (e) {
                console.error('Failed to delete media from server:', e);
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

    return (
        <div className="space-y-6">
            {/* Mold -> Finished Result UX Section (Requirement 16) */}
            <div className="p-4 rounded-xl bg-brand-dark/50 border border-brand-border space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Qolip va tayyor natija</span>
                    <span className="text-[10px] text-gray-400 font-normal">(MOLD → FINISHED_RESULT)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    {/* Left: Mold Image */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-300">Qolip rasmi</span>
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => moldInputRef.current?.click()}
                                disabled={uploading}
                                className="gap-1 text-xs"
                            >
                                <Upload className="w-3.5 h-3.5" />
                                <span>{moldMedia ? "Almashtirish" : "Yuklash"}</span>
                            </Button>
                            <input
                                ref={moldInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/avif"
                                className="hidden"
                                onChange={(e) => handleFilesSelected(e.target.files, 'MOLD')}
                            />
                        </div>

                        <div className="aspect-video relative rounded-lg border border-dashed border-brand-border bg-brand-dark overflow-hidden flex items-center justify-center">
                            {moldMedia ? (
                                <img src={moldMedia.url} alt="Qolip" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center p-3 text-gray-500 text-xs">
                                    Qolip rasmi yuklanmagan
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Desktop Arrow / Mobile Arrow */}
                    <div className="hidden md:flex justify-center text-brand-red">
                        <ArrowRight className="w-6 h-6" />
                    </div>

                    {/* Right: Finished Result Image */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-300">Tayyor mahsulot rasmi</span>
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => resultInputRef.current?.click()}
                                disabled={uploading}
                                className="gap-1 text-xs"
                            >
                                <Upload className="w-3.5 h-3.5" />
                                <span>{resultMedia ? "Almashtirish" : "Yuklash"}</span>
                            </Button>
                            <input
                                ref={resultInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/avif"
                                className="hidden"
                                onChange={(e) => handleFilesSelected(e.target.files, 'FINISHED_RESULT')}
                            />
                        </div>

                        <div className="aspect-video relative rounded-lg border border-dashed border-brand-border bg-brand-dark overflow-hidden flex items-center justify-center">
                            {resultMedia ? (
                                <img src={resultMedia.url} alt="Tayyor natija" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center p-3 text-gray-500 text-xs">
                                    Tayyor natija rasmi yuklanmagan
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Drag & Drop / Upload Area */}
            <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="text-xs font-semibold text-gray-300">Galereya va boshqa medialar</label>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Rol:</span>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="bg-brand-dark border border-brand-border rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-brand-red"
                        >
                            {Object.entries(MEDIA_ROLE_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Drag and Drop Zone */}
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragOver
                            ? 'border-brand-red bg-brand-red/10'
                            : 'border-brand-border hover:border-brand-red/50 bg-brand-dark/30'
                        }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        className="hidden"
                        onChange={(e) => handleFilesSelected(e.target.files)}
                    />

                    <div className="flex flex-col items-center gap-2">
                        {uploading ? (
                            <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
                        ) : (
                            <Upload className="w-8 h-8 text-gray-400" />
                        )}
                        <p className="text-sm font-medium text-white">
                            {uploading ? uploadProgress : 'Rasm yuklash uchun bosing yoki shu yerga tashlang'}
                        </p>
                        <p className="text-xs text-gray-400">
                            Formatlar: JPG, PNG, WebP, AVIF (Maks. 10MB)
                        </p>
                    </div>
                </div>

                {/* URL Add Fallback */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="url"
                            value={addUrlInput}
                            onChange={(e) => setAddUrlInput(e.target.value)}
                            placeholder="Yoki rasm URL manzilini kiriting..."
                            className="w-full bg-brand-dark border border-brand-border rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
                        />
                    </div>
                    <Button type="button" size="sm" variant="ghost" onClick={handleAddByUrl}>
                        URL orqali qo'shish
                    </Button>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold">
                        {error}
                    </div>
                )}
            </div>

            {/* Media Grid */}
            <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-300">Barcha yuklangan fayllar ({media.length})</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {media.map((m, idx) => (
                        <div
                            key={idx}
                            className="relative group bg-brand-dark border border-brand-border rounded-xl overflow-hidden"
                        >
                            <div className="aspect-square relative">
                                <img src={m.url} alt={m.alt || ''} className="w-full h-full object-cover" />
                                <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-black/80 text-white border border-white/10">
                                    {MEDIA_ROLE_LABELS[m.type] || m.type}
                                </div>

                                {m.type !== 'MAIN' && (
                                    <button
                                        type="button"
                                        onClick={() => handleSetMain(idx)}
                                        className="absolute top-1.5 right-8 p-1 rounded bg-black/70 hover:bg-brand-red text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Asosiy rasm qilish"
                                    >
                                        Asosiy
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => handleRemove(idx)}
                                    className="absolute top-1.5 right-1.5 p-1 rounded bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                    title="O'chirish"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
