import crypto from 'crypto';
import { CreatePaymentInput, CreatePaymentResult, PaymentProvider, VerificationResult } from './types';

export class ClickPaymentProvider implements PaymentProvider {
    name = 'CLICK';

    private get serviceId(): string {
        return process.env.CLICK_SERVICE_ID || '';
    }

    private get merchantId(): string {
        return process.env.CLICK_MERCHANT_ID || '';
    }

    private get secretKey(): string {
        return process.env.CLICK_SECRET_KEY || '';
    }

    isConfigured(): boolean {
        return Boolean(this.serviceId && this.merchantId && this.secretKey);
    }

    async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
        const merchantTransactionId = `CLK-${input.orderNumber}-${Date.now().toString(36)}`;

        if (!this.isConfigured()) {
            return {
                success: false,
                merchantTransactionId,
                error: 'Click provider credentials not configured',
            };
        }

        const returnUrl = input.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/uz/order-success/${input.orderId}`;
        const paymentUrl = `https://my.click.uz/services/pay?service_id=${this.serviceId}&merchant_id=${this.merchantId}&amount=${input.amount}&transaction_param=${encodeURIComponent(merchantTransactionId)}&return_url=${encodeURIComponent(returnUrl)}`;

        return {
            success: true,
            merchantTransactionId,
            paymentUrl,
        };
    }

    async verifyCallback(
        _headers: Headers | Record<string, string>,
        body: Record<string, unknown> | string
    ): Promise<VerificationResult> {
        const data = typeof body === 'string' ? JSON.parse(body) : body;

        const {
            click_trans_id,
            service_id,
            click_paydoc_id,
            merchant_trans_id,
            amount,
            action,
            error,
            error_note,
            sign_time,
            sign_string,
        } = data;

        if (!this.isConfigured()) {
            return {
                isValid: false,
                error: 'Click payment provider not configured',
                errorCode: -1,
            };
        }

        if (String(service_id) !== this.serviceId) {
            return {
                isValid: false,
                error: 'Invalid service ID',
                errorCode: -2,
            };
        }

        if (Number(error) < 0) {
            return {
                isValid: false,
                error: String(error_note || 'Provider reported error'),
                errorCode: Number(error),
            };
        }

        // Click signature calculation formula:
        // md5(click_trans_id + service_id + secret_key + merchant_trans_id + amount + action + sign_time)
        const expectedSignRaw = `${click_trans_id}${service_id}${this.secretKey}${merchant_trans_id}${amount}${action}${sign_time}`;
        const expectedSign = crypto.createHash('md5').update(expectedSignRaw).digest('hex');

        if (String(sign_string).toLowerCase() !== expectedSign.toLowerCase()) {
            return {
                isValid: false,
                error: 'Invalid signature',
                errorCode: -1,
            };
        }

        const parsedAmount = Math.round(Number(amount));
        const status = Number(action) === 1 ? 'PAID' : 'PROCESSING';

        return {
            isValid: true,
            merchantTransactionId: String(merchant_trans_id),
            providerTransactionId: String(click_trans_id || click_paydoc_id || ''),
            amount: parsedAmount,
            status,
            rawResponse: data,
        };
    }
}
