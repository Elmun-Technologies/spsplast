import { db as prisma } from '@/lib/db';

export interface BusinessSettings {
    companyName?: string;
    phoneDisplay?: string;
    phoneRaw?: string;
    telegramUrl?: string;
    telegramHandle?: string;
    whatsappUrl?: string;
    instagramUrl?: string;
    email?: string;
    addressUz?: string;
    addressRu?: string;
    workingHoursUz?: string;
    workingHoursRu?: string;
    latitude?: number | null;
    longitude?: number | null;

    // Content claims
    yearsExperience?: number | null;
    moldDurabilityCasts?: number | null;
    warrantyTextUz?: string;
    warrantyTextRu?: string;
    productionCapacityUz?: string;
    productionCapacityRu?: string;
}

const SETTINGS_KEY = 'business_settings';

/**
 * Returns centralized business settings.
 * Unconfigured / unverified values are returned as undefined.
 */
export async function getBusinessSettings(): Promise<BusinessSettings> {
    try {
        const setting = await prisma.setting.findUnique({
            where: { key: SETTINGS_KEY },
        });
        if (!setting || !setting.valueJson) {
            return {};
        }
        const parsed = JSON.parse(setting.valueJson);
        return parsed;
    } catch (error) {
        console.error('Error fetching business settings:', error);
        return {};
    }
}

/**
 * Validates and updates business settings.
 */
export async function updateBusinessSettings(input: Partial<BusinessSettings>): Promise<BusinessSettings> {
    const errors: string[] = [];

    if (input.email && input.email.trim().length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.email.trim())) {
            errors.push('Noto\'g\'ri email formati');
        }
    }

    const validateUrl = (url?: string, name?: string) => {
        if (url && url.trim().length > 0) {
            try {
                new URL(url.trim());
            } catch {
                errors.push(`Noto'g'ri URL formati: ${name || 'havola'}`);
            }
        }
    };

    validateUrl(input.telegramUrl, 'Telegram');
    validateUrl(input.whatsappUrl, 'WhatsApp');
    validateUrl(input.instagramUrl, 'Instagram');

    if (errors.length > 0) {
        throw new Error(errors.join(', '));
    }

    const current = await getBusinessSettings();
    const updated: BusinessSettings = {
        ...current,
        ...input,
        // Clean string values
        companyName: input.companyName?.trim() || current.companyName,
        phoneDisplay: input.phoneDisplay?.trim() ?? current.phoneDisplay,
        phoneRaw: input.phoneRaw?.trim() ?? current.phoneRaw,
        telegramUrl: input.telegramUrl?.trim() ?? current.telegramUrl,
        telegramHandle: input.telegramHandle?.trim() ?? current.telegramHandle,
        whatsappUrl: input.whatsappUrl?.trim() ?? current.whatsappUrl,
        instagramUrl: input.instagramUrl?.trim() ?? current.instagramUrl,
        email: input.email?.trim() ?? current.email,
        addressUz: input.addressUz?.trim() ?? current.addressUz,
        addressRu: input.addressRu?.trim() ?? current.addressRu,
        workingHoursUz: input.workingHoursUz?.trim() ?? current.workingHoursUz,
        workingHoursRu: input.workingHoursRu?.trim() ?? current.workingHoursRu,
        latitude: input.latitude !== undefined ? input.latitude : current.latitude,
        longitude: input.longitude !== undefined ? input.longitude : current.longitude,
        yearsExperience: input.yearsExperience !== undefined ? input.yearsExperience : current.yearsExperience,
        moldDurabilityCasts: input.moldDurabilityCasts !== undefined ? input.moldDurabilityCasts : current.moldDurabilityCasts,
        warrantyTextUz: input.warrantyTextUz?.trim() ?? current.warrantyTextUz,
        warrantyTextRu: input.warrantyTextRu?.trim() ?? current.warrantyTextRu,
        productionCapacityUz: input.productionCapacityUz?.trim() ?? current.productionCapacityUz,
        productionCapacityRu: input.productionCapacityRu?.trim() ?? current.productionCapacityRu,
    };

    const jsonValue = JSON.stringify(updated);

    await prisma.setting.upsert({
        where: { key: SETTINGS_KEY },
        create: {
            key: SETTINGS_KEY,
            valueJson: jsonValue,
        },
        update: {
            valueJson: jsonValue,
        },
    });

    return updated;
}
