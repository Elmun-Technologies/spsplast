'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

const STATUS_OPTIONS = [
    { value: 'NEW', label: 'NEW (Yangi)' },
    { value: 'CONFIRMED', label: 'CONFIRMED (Tasdiqlangan)' },
    { value: 'PROCESSING', label: 'PROCESSING (Jarayonda)' },
    { value: 'READY', label: 'READY (Tayyor)' },
    { value: 'SHIPPED', label: 'SHIPPED (Yuborilgan)' },
    { value: 'DELIVERED', label: 'DELIVERED (Yetkazildi)' },
    { value: 'CANCELLED', label: 'CANCELLED (Bekor qilingan)' },
];

interface OrderStatusControlProps {
    orderId: string;
    currentStatus: string;
}

export function OrderStatusControl({ orderId, currentStatus }: OrderStatusControlProps) {
    const router = useRouter();
    const [status, setStatus] = useState(currentStatus);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleUpdate = async () => {
        if (status === currentStatus) return;

        if (status === 'CANCELLED') {
            const confirmCancel = confirm(
                'Haqiqatan ham ushbu buyurtmani BEKOR qilmoqchimisiz? Zaxira omborga qaytariladi.'
            );
            if (!confirmCancel) return;
        }

        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const res = await fetch(`/api/admin/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, note }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccessMsg('Holat yangilandi!');
                setNote('');
                router.refresh();
            } else {
                setErrorMsg(data.error || 'O‘zgartirishda xatolik yuz berdi');
            }
        } catch (err) {
            console.error(err);
            setErrorMsg('Tarmoq xatosi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-brand-card border border-brand-border rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 text-xs">
            {errorMsg && (
                <div className="text-red-400 font-bold px-2 py-1 bg-red-500/10 rounded">
                    {errorMsg}
                </div>
            )}
            {successMsg && (
                <div className="text-emerald-400 font-bold px-2 py-1 bg-emerald-500/10 rounded">
                    {successMsg}
                </div>
            )}

            <input
                type="text"
                placeholder="Admin izohi (ixtiyoriy)..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="bg-brand-dark border border-brand-border rounded px-3 py-1.5 text-white text-xs focus:outline-none focus:border-brand-red flex-1"
            />

            <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-brand-dark border border-brand-border rounded px-3 py-1.5 text-white font-bold focus:outline-none focus:border-brand-red"
            >
                {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>

            <Button
                size="sm"
                onClick={handleUpdate}
                isLoading={loading}
                disabled={loading || status === currentStatus}
            >
                Yangilash
            </Button>
        </div>
    );
}
