/**
 * Telegram order/lead notifications.
 *
 * The bot is called with `parse_mode: HTML`, so any user-supplied text
 * (customer name, product name, lead message) has to be escaped — otherwise a
 * name like `<b>` or `<a href=…>` breaks the message or injects markup into the
 * admin chat.
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

export async function sendTelegramNotification(message: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
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
      }),
    });

    return res.ok;
  } catch (err) {
    console.error('Failed to send Telegram notification:', err);
    return false;
  }
}
