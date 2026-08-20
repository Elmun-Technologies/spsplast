import { db as prisma } from '@/lib/db';
import { AmoCrmClient } from '@/lib/amocrm/client';

export type JobType = 'AMOCRM_SYNC_LEAD' | 'AMOCRM_SYNC_STATUS';

export async function enqueueIntegrationJob(
    type: JobType,
    payload: Record<string, unknown>,
    entityType: string = 'Order',
    entityId: string = '',
    provider: string = 'AMOCRM'
) {
    return await prisma.integrationJob.create({
        data: {
            type,
            entityType,
            entityId: entityId || (payload.orderId as string) || (payload.leadId as string) || 'system',
            provider,
            status: 'PENDING',
            payloadJson: JSON.stringify(payload),
        },
    });
}

/**
 * Recovers stuck jobs in PROCESSING state older than timeoutMs (default 15 minutes).
 */
export async function recoverStuckIntegrationJobs(timeoutMs: number = 15 * 60 * 1000): Promise<number> {
    const cutoff = new Date(Date.now() - timeoutMs);
    const result = await prisma.integrationJob.updateMany({
        where: {
            status: 'PROCESSING',
            updatedAt: { lt: cutoff },
        },
        data: {
            status: 'PENDING',
        },
    });
    return result.count;
}

export async function processPendingIntegrationJobs(): Promise<number> {
    // 1. Recover stuck jobs first
    await recoverStuckIntegrationJobs();

    // 2. Fetch pending or retry eligible jobs
    const pendingJobs = await prisma.integrationJob.findMany({
        where: {
            status: { in: ['PENDING', 'RETRY'] },
            attempts: { lt: 5 },
            nextAttemptAt: { lte: new Date() },
        },
        take: 10,
        orderBy: { createdAt: 'asc' },
    });

    if (pendingJobs.length === 0) return 0;

    const amoClient = new AmoCrmClient();
    let processed = 0;

    for (const job of pendingJobs) {
        // Atomic job claim to prevent race conditions in multi-instance environment
        const claimed = await prisma.integrationJob.updateMany({
            where: {
                id: job.id,
                status: { in: ['PENDING', 'RETRY'] },
            },
            data: {
                status: 'PROCESSING',
                attempts: job.attempts + 1,
            },
        });

        if (claimed.count === 0) {
            // Another worker claimed this job concurrently
            continue;
        }

        try {
            if (!job.payloadJson) {
                await prisma.integrationJob.update({
                    where: { id: job.id },
                    data: { status: 'FAILED', lastError: 'Empty payload' },
                });
                continue;
            }

            const payload = JSON.parse(job.payloadJson);

            if (job.type === 'AMOCRM_SYNC_LEAD') {
                const order = await prisma.order.findUnique({
                    where: { id: payload.orderId },
                    include: { items: true },
                });

                if (order) {
                    const itemsSummary = order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ');
                    const leadId = await amoClient.syncLead({
                        orderId: order.id,
                        orderNumber: order.orderNumber,
                        customerName: order.customerName,
                        customerPhone: order.customerPhone,
                        totalAmount: order.totalAmount,
                        status: order.status,
                        address: order.address,
                        deliveryType: order.deliveryType,
                        paymentMethod: order.paymentMethod,
                        itemsSummary,
                        utmSource: order.utmSource || undefined,
                        utmMedium: order.utmMedium || undefined,
                        utmCampaign: order.utmCampaign || undefined,
                    }, order.amocrmLeadId);

                    if (leadId) {
                        await prisma.order.update({
                            where: { id: order.id },
                            data: {
                                amocrmLeadId: leadId,
                                amocrmSyncedAt: new Date(),
                            },
                        });
                    }
                }
            }

            await prisma.integrationJob.update({
                where: { id: job.id },
                data: { status: 'SUCCESS' },
            });
            processed++;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Processing error';
            await prisma.integrationJob.update({
                where: { id: job.id },
                data: {
                    status: job.attempts + 1 >= 5 ? 'FAILED' : 'RETRY',
                    lastError: errorMsg,
                    nextAttemptAt: new Date(Date.now() + Math.pow(2, job.attempts + 1) * 60 * 1000), // exponential backoff
                },
            });
        }
    }

    return processed;
}
