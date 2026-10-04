/**
 * Telegram zayafka bildirishnomalari.
 *
 * Bot `parse_mode: HTML` bilan chaqiriladi, shuning uchun foydalanuvchi
 * kiritgan har qanday matn (ism, mahsulot nomi, izoh) escape qilinishi shart —
 * aks holda `<b>` yoki `<a href=…>` kabi qiymat xabarni buzadi yoki admin
 * chatga markup inject qiladi.
 */

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
};

export function escapeTelegramHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>]/g, (ch) => HTML_ESCAPES[ch] || ch);
}

/** Token va chat ID ikkalasi ham bormi — health-check shundan foydalanadi. */
export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

export async function sendTelegramNotification(message: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    // Mahalliy ishlab chiqishda xabar konsolga chiqadi — forma oqimini
    // Telegram'siz ham tekshirish mumkin.
    console.log('[Telegram Bot Mock Notification]:\n', message);
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      console.error('Telegram API xatosi:', res.status, await res.text().catch(() => ''));
    }

    return res.ok;
  } catch (err) {
    console.error('Failed to send Telegram notification:', err);
    return false;
  }
}
