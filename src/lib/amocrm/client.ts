import { db as prisma } from '@/lib/db';

export interface AmoCrmLeadData {
    orderId: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    totalAmount: number;
    status: string;
    address?: string;
    deliveryType?: string;
    paymentMethod?: string;
    itemsSummary?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
}

export class AmoCrmClient {
    private get subdomain(): string {
        return process.env.AMOCRM_SUBDOMAIN || '';
    }

    private get clientId(): string {
        return process.env.AMOCRM_CLIENT_ID || '';
    }

    private get clientSecret(): string {
        return process.env.AMOCRM_CLIENT_SECRET || '';
    }

    private get redirectUri(): string {
        return process.env.AMOCRM_REDIRECT_URI || '';
    }

    isConfigured(): boolean {
        return Boolean(this.subdomain && this.clientId && this.clientSecret);
    }

    async getAccessToken(): Promise<string | null> {
        if (!this.isConfigured()) return null;

        const tokenRecord = await prisma.amoCrmToken.findFirst({
            orderBy: { updatedAt: 'desc' },
        });

        if (!tokenRecord) return null;

        // Check if token expired or about to expire (within 5 min)
        if (tokenRecord.expiresAt < new Date(Date.now() + 5 * 60 * 1000)) {
            return await this.refreshAccessToken(tokenRecord.refreshToken);
        }

        return tokenRecord.accessToken;
    }

    async exchangeCodeForToken(code: string): Promise<boolean> {
        if (!this.isConfigured()) return false;

        const url = `https://${this.subdomain}.amocrm.ru/oauth2/access_token`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                grant_type: 'authorization_code',
                code,
                redirect_uri: this.redirectUri,
            }),
        });

        if (!res.ok) {
            console.error('Failed to exchange amoCRM code:', await res.text());
            return false;
        }

        const data = await res.json();
        const expiresAt = new Date(Date.now() + (data.expires_in || 86400) * 1000);

        await prisma.amoCrmToken.deleteMany({});
        await prisma.amoCrmToken.create({
            data: {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresAt,
            },
        });

        return true;
    }

    async refreshAccessToken(refreshToken: string): Promise<string | null> {
        if (!this.isConfigured()) return null;

        try {
            const url = `https://${this.subdomain}.amocrm.ru/oauth2/access_token`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                    redirect_uri: this.redirectUri,
                }),
            });

            if (!res.ok) {
                console.error('Failed to refresh amoCRM token:', await res.text());
                return null;
            }

            const data = await res.json();
            const expiresAt = new Date(Date.now() + (data.expires_in || 86400) * 1000);

            await prisma.amoCrmToken.deleteMany({});
            const newToken = await prisma.amoCrmToken.create({
                data: {
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token,
                    expiresAt,
                },
            });

            return newToken.accessToken;
        } catch (err) {
            console.error('amoCRM token refresh exception:', err);
            return null;
        }
    }

    async syncLead(data: AmoCrmLeadData, existingLeadId?: string | null): Promise<string | null> {
        const token = await this.getAccessToken();
        if (!token) return null;

        const baseUrl = `https://${this.subdomain}.amocrm.ru/api/v4`;

        // If lead already exists, update it
        if (existingLeadId) {
            const updatePayload = [
                {
                    id: Number(existingLeadId),
                    name: `SPS Plast Order #${data.orderNumber}`,
                    price: data.totalAmount,
                },
            ];

            const res = await fetch(`${baseUrl}/leads`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatePayload),
            });

            if (res.ok) return existingLeadId;
        }

        // Create new lead with complex embedded contact if creating new
        const createPayload = [
            {
                name: `SPS Plast Order #${data.orderNumber}`,
                price: data.totalAmount,
                _embedded: {
                    contacts: [
                        {
                            name: data.customerName,
                            custom_fields_values: [
                                {
                                    field_code: 'PHONE',
                                    values: [{ value: data.customerPhone, enum_code: 'WORK' }],
                                },
                            ],
                        },
                    ],
                },
            },
        ];

        const res = await fetch(`${baseUrl}/leads/complex`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(createPayload),
        });

        if (!res.ok) {
            console.error('Failed to create lead in amoCRM:', await res.text());
            return null;
        }

        const responseData = await res.json();
        const createdLeadId = responseData[0]?.id || responseData[0]?.lead_id;

        return createdLeadId ? String(createdLeadId) : null;
    }
}
