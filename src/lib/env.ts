import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    DIRECT_URL: z.string().optional(),
    AUTH_SECRET: z.string().optional(),
    INTEGRATION_ENCRYPTION_KEY: z.string().optional(),
    NEXT_PUBLIC_SITE_URL: z.string().optional(),
    CRON_SECRET: z.string().optional(),
    STORAGE_PROVIDER: z.enum(['local', 's3', 'r2']).optional(),
    S3_ENDPOINT: z.string().optional(),
    S3_REGION: z.string().optional(),
    S3_BUCKET: z.string().optional(),
    S3_ACCESS_KEY: z.string().optional(),
    S3_SECRET_KEY: z.string().optional(),
    S3_PUBLIC_URL: z.string().optional(),
    TELEGRAM_BOT_TOKEN: z.string().optional(),
    TELEGRAM_CHAT_ID: z.string().optional(),
    AMOCRM_SUBDOMAIN: z.string().optional(),
    AMOCRM_CLIENT_ID: z.string().optional(),
    AMOCRM_CLIENT_SECRET: z.string().optional(),
    AMOCRM_REDIRECT_URI: z.string().optional(),
    CLICK_MERCHANT_ID: z.string().optional(),
    CLICK_SERVICE_ID: z.string().optional(),
    CLICK_SECRET_KEY: z.string().optional(),
    PAYME_MERCHANT_ID: z.string().optional(),
    PAYME_SECRET_KEY: z.string().optional(),
});

export interface EnvValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

export function validateEnvironment(): EnvValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        for (const issue of result.error.issues) {
            errors.push(`${issue.path.join('.')}: ${issue.message}`);
        }
    }

    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
        if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 16) {
            errors.push('AUTH_SECRET is missing or less than 16 characters in production!');
        }

        if (!process.env.NEXT_PUBLIC_SITE_URL) {
            warnings.push('NEXT_PUBLIC_SITE_URL is not configured in production (falling back to http://localhost:3000)');
        } else if (process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')) {
            warnings.push('NEXT_PUBLIC_SITE_URL is using localhost in production environment!');
        }

        // Serverless / persistent storage check
        const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
        const storageProvider = process.env.STORAGE_PROVIDER || (process.env.S3_ENDPOINT ? 's3' : 'local');

        if (isServerless && storageProvider === 'local') {
            errors.push('Ephemeral storage (STORAGE_PROVIDER=local) detected in serverless production environment! S3 or R2 must be configured.');
        }

        // Check if Click payment credentials are incomplete
        const clickKeys = [process.env.CLICK_MERCHANT_ID, process.env.CLICK_SERVICE_ID, process.env.CLICK_SECRET_KEY];
        const clickSet = clickKeys.filter(Boolean).length;
        if (clickSet > 0 && clickSet < 3) {
            errors.push('Partial Click configuration: CLICK_MERCHANT_ID, CLICK_SERVICE_ID, and CLICK_SECRET_KEY must all be provided.');
        }

        // Check if Payme credentials are incomplete
        const paymeKeys = [process.env.PAYME_MERCHANT_ID, process.env.PAYME_SECRET_KEY];
        const paymeSet = paymeKeys.filter(Boolean).length;
        if (paymeSet > 0 && paymeSet < 2) {
            errors.push('Partial Payme configuration: PAYME_MERCHANT_ID and PAYME_SECRET_KEY must both be provided.');
        }

        // Check if amoCRM credentials are incomplete
        const amoKeys = [process.env.AMOCRM_SUBDOMAIN, process.env.AMOCRM_CLIENT_ID, process.env.AMOCRM_CLIENT_SECRET, process.env.AMOCRM_REDIRECT_URI];
        const amoSet = amoKeys.filter(Boolean).length;
        if (amoSet > 0 && amoSet < 4) {
            errors.push('Partial amoCRM configuration: AMOCRM_SUBDOMAIN, AMOCRM_CLIENT_ID, AMOCRM_CLIENT_SECRET, and AMOCRM_REDIRECT_URI must all be provided.');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
