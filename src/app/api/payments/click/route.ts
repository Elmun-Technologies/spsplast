import { NextRequest, NextResponse } from 'next/server';
import { ClickPaymentProvider } from '@/lib/payments/click';
import { db as prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const bodyText = await req.text();
        let bodyData: Record<string, unknown> = {};

        if (bodyText.startsWith('{') || bodyText.startsWith('[')) {
            bodyData = JSON.parse(bodyText);
        } else {
            const params = new URLSearchParams(bodyText);
            params.forEach((value, key) => {
                bodyData[key] = value;
            });
        }

        const provider = new ClickPaymentProvider();
        const verification = await provider.verifyCallback(req.headers, bodyData);

        const clickTransId = String(bodyData.click_trans_id || '');
        const merchantTransId = String(bodyData.merchant_trans_id || '');
        const action = Number(bodyData.action || 0);
        const amount = Math.round(Number(bodyData.amount || 0));

        if (!verification.isValid) {
            return NextResponse.json({
                click_trans_id: clickTransId,
                merchant_trans_id: merchantTransId,
                error: verification.errorCode || -1,
                error_note: verification.error || 'Verification failed',
            });
        }

        // Find associated order
        // merchantTransId format: CLK-{orderNumber}-{timestamp} or orderId/orderNumber
        const orderNumber = merchantTransId.replace(/^CLK-/, '').split('-')[0];
        const order = await prisma.order.findFirst({
            where: {
                OR: [
                    { orderNumber: orderNumber },
                    { id: merchantTransId },
                ],
            },
        });

        if (!order) {
            return NextResponse.json({
                click_trans_id: clickTransId,
                merchant_trans_id: merchantTransId,
                error: -5,
                error_note: 'User/Order does not exist',
            });
        }

        if (order.totalAmount !== amount) {
            return NextResponse.json({
                click_trans_id: clickTransId,
                merchant_trans_id: merchantTransId,
                error: -2,
                error_note: 'Invalid amount',
            });
        }

        // Record/update PaymentTransaction in DB safely (idempotent)
        let tx = await prisma.paymentTransaction.findUnique({
            where: { merchantTransactionId: merchantTransId },
        });

        if (action === 0) {
            // Action 0: Prepare
            if (!tx) {
                tx = await prisma.paymentTransaction.create({
                    data: {
                        orderId: order.id,
                        provider: 'CLICK',
                        providerTransactionId: clickTransId,
                        merchantTransactionId: merchantTransId,
                        amount: amount,
                        status: 'PROCESSING',
                        rawProviderStatus: 'PREPARE',
                    },
                });
            }

            return NextResponse.json({
                click_trans_id: clickTransId,
                merchant_trans_id: merchantTransId,
                merchant_prepare_id: tx.id,
                error: 0,
                error_note: 'Success',
            });
        } else if (action === 1) {
            // Action 1: Complete
            if (!tx) {
                tx = await prisma.paymentTransaction.create({
                    data: {
                        orderId: order.id,
                        provider: 'CLICK',
                        providerTransactionId: clickTransId,
                        merchantTransactionId: merchantTransId,
                        amount: amount,
                        status: 'PAID',
                        rawProviderStatus: 'COMPLETE',
                        paidAt: new Date(),
                    },
                });
            } else {
                tx = await prisma.paymentTransaction.update({
                    where: { id: tx.id },
                    data: {
                        status: 'PAID',
                        rawProviderStatus: 'COMPLETE',
                        paidAt: new Date(),
                    },
                });
            }

            // Update Order paymentStatus to PAID
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    paymentStatus: 'PAID',
                    status: order.status === 'NEW' ? 'CONFIRMED' : order.status,
                },
            });

            // Log integration
            await prisma.integrationLog.create({
                data: {
                    provider: 'CLICK',
                    operation: 'COMPLETE',
                    entityType: 'Order',
                    entityId: order.id,
                    status: 'SUCCESS',
                    detailsJson: JSON.stringify({ clickTransId, amount }),
                },
            });

            return NextResponse.json({
                click_trans_id: clickTransId,
                merchant_trans_id: merchantTransId,
                merchant_confirm_id: tx.id,
                error: 0,
                error_note: 'Success',
            });
        }

        return NextResponse.json({
            click_trans_id: clickTransId,
            merchant_trans_id: merchantTransId,
            error: -3,
            error_note: 'Action not found',
        });
    } catch (error) {
        console.error('Click callback error:', error);
        return NextResponse.json({
            error: -1,
            error_note: error instanceof Error ? error.message : 'Internal error',
        }, { status: 500 });
    }
}
