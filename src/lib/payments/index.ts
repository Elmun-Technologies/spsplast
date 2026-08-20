import { ClickPaymentProvider } from './click';
import { PaymePaymentProvider } from './payme';
import { PaymentProvider } from './types';

const providers: Record<string, PaymentProvider> = {
    CLICK: new ClickPaymentProvider(),
    PAYME: new PaymePaymentProvider(),
};

export function getPaymentProvider(providerName: string): PaymentProvider | null {
    const key = providerName.toUpperCase();
    return providers[key] || null;
}

export { ClickPaymentProvider } from './click';
export { PaymePaymentProvider } from './payme';
export * from './types';
