import React from 'react';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { formatPrice } from '@/lib/utils';
import { OrderStatusControl } from '@/components/admin/OrderStatusControl';
import { ArrowLeft, Phone, MapPin, User, Tag, Clock, CreditCard, ShieldCheck } from 'lucide-react';

interface OrderDetailPageProps {
    params: { id: string };
}

export default async function AdminOrderDetailPage({ params: { id } }: OrderDetailPageProps) {
    const session = await getAdminSession();
    if (!session) {
        redirect('/admin/login');
    }

    const order = await db.order.findUnique({
        where: { id },
        include: {
            items: true,
            statusHistory: {
                orderBy: { createdAt: 'desc' },
            },
        },
    });

    if (!order) {
        notFound();
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            {/* Header / Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-4">
                <div>
                    <Link href="/admin/orders" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white mb-2">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Buyurtmalar ro‘yxatiga qaytish</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black text-white">Buyurtma #{order.orderNumber}</h1>
                        <span className="px-3 py-1 rounded-full bg-brand-red/20 text-brand-red border border-brand-red/30 font-mono font-bold text-xs">
                            {order.status}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                        Yaratilgan vaqti: {new Date(order.createdAt).toLocaleString()}
                    </p>
                </div>

                {/* Dynamic Status Switcher Component */}
                <OrderStatusControl orderId={order.id} currentStatus={order.status} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Details (2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Products Snapshot */}
                    <div className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-4">
                        <h2 className="text-base font-bold text-white border-b border-brand-border pb-3 flex items-center gap-2">
                            <Tag className="w-4 h-4 text-brand-red" />
                            Xarid Qilingan Mahsulotlar ({order.items.length})
                        </h2>

                        <div className="divide-y divide-brand-border">
                            {order.items.map((item) => (
                                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <p className="font-bold text-white text-sm">{item.productName}</p>
                                        {item.variantName && (
                                            <p className="text-xs text-brand-red font-medium">Variant: {item.variantName}</p>
                                        )}
                                        {item.sku && (
                                            <p className="text-[10px] text-gray-400 font-mono">SKU: {item.sku}</p>
                                        )}
                                    </div>

                                    <div className="text-right">
                                        <p className="text-xs text-gray-400">
                                            {item.quantity} dona x {formatPrice(item.unitPrice, 'uz')}
                                        </p>
                                        <p className="font-black text-white text-sm">
                                            {formatPrice(item.lineTotal, 'uz')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-brand-border pt-4 space-y-2 text-sm">
                            <div className="flex justify-between text-gray-400">
                                <span>Mahsulotlar subto‘lovi:</span>
                                <span className="text-white font-medium">
                                    {formatPrice(
                                        order.items.reduce((sum, i) => sum + i.lineTotal, 0),
                                        'uz'
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between text-gray-400">
                                <span>Yetkazib berish narxi:</span>
                                <span className="text-white font-medium">
                                    {order.deliveryFee === 0 ? 'Bepul / Kelishiladi' : formatPrice(order.deliveryFee, 'uz')}
                                </span>
                            </div>
                            <div className="flex justify-between text-lg font-black text-white pt-3 border-t border-brand-border">
                                <span>Jami Summa:</span>
                                <span className="text-brand-red">{formatPrice(order.totalAmount, 'uz')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Status Timeline */}
                    <div className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-4">
                        <h2 className="text-base font-bold text-white border-b border-brand-border pb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-400" />
                            Holat O‘zgarishi Tarixi
                        </h2>

                        {order.statusHistory.length === 0 ? (
                            <p className="text-xs text-gray-400">Tarix hozircha yo‘q.</p>
                        ) : (
                            <div className="space-y-4">
                                {order.statusHistory.map((h) => (
                                    <div key={h.id} className="border-l-2 border-brand-red pl-4 py-1 space-y-1">
                                        <div className="flex items-center gap-2 text-xs font-bold text-white">
                                            <span>{h.fromStatus || 'BOSH'}</span>
                                            <span>→</span>
                                            <span className="text-emerald-400">{h.toStatus}</span>
                                        </div>
                                        {h.note && <p className="text-xs text-gray-300 italic">{h.note}</p>}
                                        <p className="text-[10px] text-gray-500 font-mono">
                                            {new Date(h.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info (1 col) */}
                <div className="space-y-6">
                    {/* Customer Card */}
                    <div className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-3">
                        <h3 className="text-xs font-mono font-bold text-gray-400 uppercase flex items-center gap-2">
                            <User className="w-4 h-4 text-brand-red" />
                            Xaridor
                        </h3>
                        <div>
                            <p className="font-bold text-white text-base">{order.customerName}</p>
                            <a
                                href={`tel:${order.customerPhone}`}
                                className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:underline mt-1"
                            >
                                <Phone className="w-3.5 h-3.5" />
                                <span>{order.customerPhone}</span>
                            </a>
                        </div>
                        {order.notes && (
                            <div className="pt-2 border-t border-brand-border">
                                <p className="text-[10px] text-gray-400">Xaridor izohi:</p>
                                <p className="text-xs text-gray-200 italic mt-0.5">{order.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Delivery & Payment Card */}
                    <div className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-4 text-xs">
                        <h3 className="text-xs font-mono font-bold text-gray-400 uppercase flex items-center gap-2 border-b border-brand-border pb-2">
                            <MapPin className="w-4 h-4 text-brand-red" />
                            Yetkazish va To‘lov
                        </h3>

                        <div className="space-y-2">
                            <div>
                                <p className="text-gray-400">Usul:</p>
                                <p className="font-bold text-white">{order.deliveryType}</p>
                            </div>
                            <div>
                                <p className="text-gray-400">Mintaqa & Manzil:</p>
                                <p className="font-bold text-white">{order.region}</p>
                                {order.city && <p className="text-gray-300">{order.city}</p>}
                                <p className="text-gray-300">{order.address}</p>
                            </div>

                            <div className="pt-2 border-t border-brand-border">
                                <p className="text-gray-400">To‘lov usuli:</p>
                                <p className="font-bold text-white flex items-center gap-1 mt-0.5">
                                    <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                                    {order.paymentMethod} ({order.paymentStatus})
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Attribution Card */}
                    <div className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-3 text-xs">
                        <h3 className="text-xs font-mono font-bold text-gray-400 uppercase flex items-center gap-2 border-b border-brand-border pb-2">
                            <ShieldCheck className="w-4 h-4 text-sky-400" />
                            Marketing Attributsiya
                        </h3>

                        <div className="space-y-1.5 font-mono text-[11px]">
                            <div className="flex justify-between">
                                <span className="text-gray-400">UTM Source:</span>
                                <span className="text-sky-300 font-bold">{order.utmSource || 'Direct'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">UTM Medium:</span>
                                <span className="text-gray-200">{order.utmMedium || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">UTM Campaign:</span>
                                <span className="text-gray-200">{order.utmCampaign || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">UTM Content:</span>
                                <span className="text-gray-200">{order.utmContent || '-'}</span>
                            </div>
                            {order.gclid && (
                                <div className="flex justify-between">
                                    <span className="text-gray-400">GCLID:</span>
                                    <span className="text-emerald-400 truncate max-w-[120px]">{order.gclid}</span>
                                </div>
                            )}
                            {order.fbclid && (
                                <div className="flex justify-between">
                                    <span className="text-gray-400">FBCLID:</span>
                                    <span className="text-blue-400 truncate max-w-[120px]">{order.fbclid}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
