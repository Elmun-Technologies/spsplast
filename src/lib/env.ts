import { z } from 'zod';

/**
 * Muhit o'zgaruvchilari validatsiyasi.
 *
 * Backendsiz arxitekturada majburiy o'zgaruvchilar juda kam: sayt statik
 * katalogdan o'qiydi, yagona tashqi bog'liqlik — Telegram (zayafkalar) va
 * ixtiyoriy analitika ID'lari. Shuning uchun `DATABASE_URL` kabi talablar
 * olib tashlandi.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_SITE_URL: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  NEXT_PUBLIC_GTM_ID: z.string().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_YANDEX_METRICA_ID: z.string().optional(),
  NEXT_PUBLIC_META_PIXEL_ID: z.string().optional(),
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

  if (process.env.NODE_ENV === 'production') {
    // Telegram — zayafkalar yetib boradigan yagona kanal. Sozlanmasa,
    // mijoz formani to'ldiradi, lekin hech kim ko'rmaydi: eng xatarli holat.
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
      errors.push(
        'TELEGRAM_BOT_TOKEN va TELEGRAM_CHAT_ID productionda majburiy: aks holda zayafkalar hech qayerga yuborilmaydi.'
      );
    }

    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      warnings.push('NEXT_PUBLIC_SITE_URL sozlanmagan (canonical/sitemap http://localhost:3000 ga tayanadi).');
    } else if (process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')) {
      warnings.push('NEXT_PUBLIC_SITE_URL productionda localhost ga ishora qilmoqda.');
    }

    if (!process.env.NEXT_PUBLIC_GTM_ID && !process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
      warnings.push('GA4/GTM ID sozlanmagan — konversiya statistikasi yig‘ilmaydi (P0-12).');
    }
    if (!process.env.NEXT_PUBLIC_YANDEX_METRICA_ID) {
      warnings.push('Yandex Metrica ID sozlanmagan — O‘zbekiston bozorida asosiy analitika kanali.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
