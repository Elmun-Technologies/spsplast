export type PaymentMethodType = 'CASH' | 'BANK_TRANSFER' | 'CLICK' | 'PAYME';
export type PaymentStatusType = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface CreatePaymentInput {
    orderId: string;
    orderNumber: string;
    amount: number; // in UZS integer
    returnUrl?: string;
    customerPhone?: string;
}

export interface CreatePaymentResult {
    success: boolean;
    paymentUrl?: string;
    merchantTransactionId: string;
    providerTransactionId?: string;
    error?: string;
}

export interface VerificationResult {
    isValid: boolean;
    orderId?: string;
    amount?: number;
    merchantTransactionId?: string;
    providerTransactionId?: string;
    status?: PaymentStatusType;
    error?: string;
    errorCode?: number;
    rawResponse?: Record<string, unknown>;
}

export interface PaymentProvider {
    name: string;
    isConfigured(): boolean;
    createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
    verifyCallback(headers: Headers | Record<string, string>, body: Record<string, unknown> | string): Promise<VerificationResult>;
}
