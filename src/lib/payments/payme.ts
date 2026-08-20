import { CreatePaymentInput, CreatePaymentResult, PaymentProvider, VerificationResult } from './types';

export class PaymePaymentProvider implements PaymentProvider {
    name = 'PAYME';

    private get merchantId(): string {
        return process.env.PAYME_MERCHANT_ID || '';
    }

    private get secretKey(): string {
        return process.env.PAYME_SECRET_KEY || '';
    }

    isConfigured(): boolean {
        return Boolean(this.merchantId && this.secretKey);
    }

    async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
        const merchantTransactionId = `PYM-${input.orderNumber}-${Date.now().toString(36)}`;

        if (!this.isConfigured()) {
            return {
                success: false,
                merchantTransactionId,
                error: 'Payme provider credentials not configured',
            };
        }

        // Payme expects amount in tiyn (UZS * 100) and base64 encoded params in checkout URL
        // format: m=merchant_id;ac.order_id=merchantTransactionId;a=amount_in_tiyn
        const amountTiyn = input.amount * 100;
        const params = `m=${this.merchantId};ac.order_id=${merchantTransactionId};a=${amountTiyn}`;
        const base64Params = Buffer.from(params).toString('base64');
        const paymentUrl = `https://checkout.paycom.uz/${base64Params}`;

        return {
            success: true,
            merchantTransactionId,
            paymentUrl,
        };
    }

    async verifyCallback(
        headers: Headers | Record<string, string>,
        body: Record<string, unknown> | string
    ): Promise<VerificationResult> {
        const getHeader = (key: string): string | null => {
            if (headers instanceof Headers) {
                return headers.get(key) || headers.get(key.toLowerCase());
            }
            const record = headers as Record<string, string>;
            return record[key] || record[key.toLowerCase()] || null;
        };

        const authHeader = getHeader('authorization');

        if (!this.isConfigured()) {
            return {
                isValid: false,
                error: 'Payme provider credentials not configured',
                errorCode: -32504,
            };
        }

        // Validate Authorization header: "Basic " + base64("Paycom:" + secretKey)
        const expectedAuthToken = Buffer.from(`Paycom:${this.secretKey}`).toString('base64');
        const expectedAuthHeader = `Basic ${expectedAuthToken}`;

        if (!authHeader || authHeader !== expectedAuthHeader) {
            return {
                isValid: false,
                error: 'Invalid HTTP Authorization header',
                errorCode: -32504,
            };
        }

        const rpcReq = typeof body === 'string' ? JSON.parse(body) : body;
        const method = rpcReq.method as string;
        const params = rpcReq.params || {};

        if (method === 'CheckPerformTransaction' || method === 'CreateTransaction') {
            const amountInTiyn = Number(params.amount || 0);
            const amountInUzs = Math.round(amountInTiyn / 100);
            const orderId = params.account?.order_id || params.account?.orderId;

            return {
                isValid: true,
                merchantTransactionId: String(orderId || ''),
                providerTransactionId: String(params.id || ''),
                amount: amountInUzs,
                status: 'PROCESSING',
                rawResponse: rpcReq,
            };
        }

        if (method === 'PerformTransaction') {
            return {
                isValid: true,
                merchantTransactionId: String(params.account?.order_id || ''),
                providerTransactionId: String(params.id || ''),
                status: 'PAID',
                rawResponse: rpcReq,
            };
        }

        if (method === 'CancelTransaction') {
            return {
                isValid: true,
                providerTransactionId: String(params.id || ''),
                status: 'CANCELLED',
                rawResponse: rpcReq,
            };
        }

        return {
            isValid: true,
            status: 'PROCESSING',
            rawResponse: rpcReq,
        };
    }
}
