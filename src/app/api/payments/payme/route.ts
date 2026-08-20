import { NextRequest, NextResponse } from 'next/server';
import { PaymePaymentProvider } from '@/lib/payments/payme';
import { db as prisma } from '@/lib/db';

function jsonRpcError(id: unknown, code: number, messageUz: string, messageRu: string) {
    return NextResponse.json({
        jsonrpc: '2.0',
        id,
        error: {
            code,
            message: {
                uz: messageUz,
                ru: messageRu,
                en: messageRu,
            },
        },
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, method, params } = body;

        const provider = new PaymePaymentProvider();
        const verification = await provider.verifyCallback(req.headers, body);

        if (!verification.isValid) {
            return jsonRpcError(
                id,
                verification.errorCode || -32504,
                verification.error || 'Autentifikatsiya xatosi',
                verification.error || 'Ошибка аутентификации'
            );
        }

        const account = params?.account || {};
        const orderIdParam = account.order_id || account.orderId;
        const amountTiyn = Number(params?.amount || 0);
        const amountUzs = Math.round(amountTiyn / 100);

        if (method === 'CheckPerformTransaction') {
            if (!orderIdParam) {
                return jsonRpcError(id, -31001, 'Buyurtma topilmadi', 'Заказ не найден');
            }

            const orderNumber = String(orderIdParam).replace(/^PYM-/, '').split('-')[0];
            const order = await prisma.order.findFirst({
                where: {
                    OR: [
                        { orderNumber: orderNumber },
                        { id: String(orderIdParam) },
                    ],
                },
            });

            if (!order) {
                return jsonRpcError(id, -31001, 'Buyurtma topilmadi', 'Заказ не найден');
            }

            if (order.totalAmount !== amountUzs) {
                return jsonRpcError(id, -31001, 'Summa noto‘g‘ri', 'Неверная сумма');
            }

            if (order.paymentStatus === 'PAID') {
                return jsonRpcError(id, -31008, 'Buyurtma allaqachon to‘langan', 'Заказ уже оплачен');
            }

            return NextResponse.json({
                jsonrpc: '2.0',
                id,
                result: {
                    allow: true,
                },
            });
        }

        if (method === 'CreateTransaction') {
            const paymeTransId = String(params.id);
            const time = Number(params.time);

            let tx = await prisma.paymentTransaction.findFirst({
                where: { providerTransactionId: paymeTransId },
            });

            if (tx) {
                if (tx.status === 'CANCELLED') {
                    return jsonRpcError(id, -31008, 'Tranzaksiya bekor qilingan', 'Транзакция отменена');
                }
                return NextResponse.json({
                    jsonrpc: '2.0',
                    id,
                    result: {
                        create_time: tx.createdAt.getTime(),
                        transaction: tx.id,
                        state: tx.status === 'PAID' ? 2 : 1,
                    },
                });
            }

            const orderNumber = String(orderIdParam).replace(/^PYM-/, '').split('-')[0];
            const order = await prisma.order.findFirst({
                where: {
                    OR: [
                        { orderNumber: orderNumber },
                        { id: String(orderIdParam) },
                    ],
                },
            });

            if (!order) {
                return jsonRpcError(id, -31001, 'Buyurtma topilmadi', 'Заказ не найден');
            }

            if (order.totalAmount !== amountUzs) {
                return jsonRpcError(id, -31001, 'Summa noto‘g‘ri', 'Неверная сумма');
            }

            tx = await prisma.paymentTransaction.create({
                data: {
                    orderId: order.id,
                    provider: 'PAYME',
                    providerTransactionId: paymeTransId,
                    merchantTransactionId: String(orderIdParam),
                    amount: amountUzs,
                    status: 'PROCESSING',
                    rawProviderStatus: '1',
                },
            });

            return NextResponse.json({
                jsonrpc: '2.0',
                id,
                result: {
                    create_time: time || tx.createdAt.getTime(),
                    transaction: tx.id,
                    state: 1,
                },
            });
        }

        if (method === 'PerformTransaction') {
            const paymeTransId = String(params.id);

            const tx = await prisma.paymentTransaction.findFirst({
                where: { providerTransactionId: paymeTransId },
            });

            if (!tx) {
                return jsonRpcError(id, -31050, 'Tranzaksiya topilmadi', 'Транзакция не найдена');
            }

            if (tx.status === 'PAID') {
                return NextResponse.json({
                    jsonrpc: '2.0',
                    id,
                    result: {
                        transaction: tx.id,
                        perform_time: tx.paidAt ? tx.paidAt.getTime() : Date.now(),
                        state: 2,
                    },
                });
            }

            if (tx.status === 'CANCELLED') {
                return jsonRpcError(id, -31008, 'Tranzaksiya bekor qilingan', 'Транзакция отменена');
            }

            const now = new Date();
            await prisma.paymentTransaction.update({
                where: { id: tx.id },
                data: {
                    status: 'PAID',
                    rawProviderStatus: '2',
                    paidAt: now,
                },
            });

            await prisma.order.update({
                where: { id: tx.orderId },
                data: {
                    paymentStatus: 'PAID',
                    status: 'CONFIRMED',
                },
            });

            await prisma.integrationLog.create({
                data: {
                    provider: 'PAYME',
                    operation: 'PERFORM',
                    entityType: 'Order',
                    entityId: tx.orderId,
                    status: 'SUCCESS',
                    detailsJson: JSON.stringify({ paymeTransId, amount: tx.amount }),
                },
            });

            return NextResponse.json({
                jsonrpc: '2.0',
                id,
                result: {
                    transaction: tx.id,
                    perform_time: now.getTime(),
                    state: 2,
                },
            });
        }

        if (method === 'CancelTransaction') {
            const paymeTransId = String(params.id);
            const reason = Number(params.reason || 0);

            const tx = await prisma.paymentTransaction.findFirst({
                where: { providerTransactionId: paymeTransId },
            });

            if (!tx) {
                return jsonRpcError(id, -31050, 'Tranzaksiya topilmadi', 'Транзакция не найдена');
            }

            const now = new Date();
            await prisma.paymentTransaction.update({
                where: { id: tx.id },
                data: {
                    status: 'CANCELLED',
                    rawProviderStatus: '-1',
                    cancelledAt: now,
                    metadataJson: JSON.stringify({ cancelReason: reason }),
                },
            });

            if (tx.status === 'PAID') {
                await prisma.order.update({
                    where: { id: tx.orderId },
                    data: {
                        paymentStatus: 'REFUNDED',
                    },
                });
            }

            return NextResponse.json({
                jsonrpc: '2.0',
                id,
                result: {
                    transaction: tx.id,
                    cancel_time: now.getTime(),
                    state: tx.status === 'PAID' ? -2 : -1,
                },
            });
        }

        if (method === 'CheckTransaction') {
            const paymeTransId = String(params.id);
            const tx = await prisma.paymentTransaction.findFirst({
                where: { providerTransactionId: paymeTransId },
            });

            if (!tx) {
                return jsonRpcError(id, -31050, 'Tranzaksiya topilmadi', 'Транзакция не найдена');
            }

            let state = 1;
            if (tx.status === 'PAID') state = 2;
            if (tx.status === 'CANCELLED') state = -1;

            return NextResponse.json({
                jsonrpc: '2.0',
                id,
                result: {
                    create_time: tx.createdAt.getTime(),
                    perform_time: tx.paidAt ? tx.paidAt.getTime() : 0,
                    cancel_time: tx.cancelledAt ? tx.cancelledAt.getTime() : 0,
                    transaction: tx.id,
                    state,
                    reason: null,
                },
            });
        }

        return jsonRpcError(id, -32601, 'Metod topilmadi', 'Метод не найден');
    } catch (error) {
        console.error('Payme callback error:', error);
        return jsonRpcError(1, -32400, 'Tizim xatosi', 'Системная ошибка');
    }
}
