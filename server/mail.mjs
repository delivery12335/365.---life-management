import nodemailer from 'nodemailer';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

export function resetDeliveryFromEnv(env = process.env) {
  if (env.SMTP_HOST && env.MAIL_FROM) {
    const transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT ?? 587),
      secure: env.SMTP_SECURE === 'true',
      requireTLS: env.SMTP_SECURE !== 'true',
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
      connectionTimeout: 10000,
      socketTimeout: 15000,
    });
    return {
      mode: 'email',
      send: ({ to, url }) =>
        transport.sendMail({
          from: env.MAIL_FROM,
          to,
          subject: '365. — Password reset / Восстановление пароля',
          text: `365.\n\nСсылка для смены пароля / Reset your password:\n${url}\n\nСсылка действует 30 минут и используется один раз.\nThis link expires in 30 minutes and can only be used once.\n\nЕсли вы не запрашивали смену пароля, проигнорируйте письмо.\nIf you did not request a password reset, ignore this email.`,
        }),
    };
  }
  if (env.NODE_ENV === 'production') return null;
  const directory = resolve(env.MAIL_OUTBOX ?? '.data/mail');
  return {
    mode: 'local',
    send: async ({ to, url }) => {
      await mkdir(directory, { recursive: true });
      const file = join(directory, `${Date.now()}-${randomUUID()}.eml`);
      await writeFile(
        file,
        `To: ${to}\nFrom: 365. local mail\nSubject: 365. password reset\nContent-Type: text/plain; charset=utf-8\n\nЭто локальное письмо, оно не отправлено в интернет.\nThis is a local development message, not an email delivery.\n\n${url}\n\nСсылка действует 30 минут. / Expires in 30 minutes.\n`,
        { encoding: 'utf8', mode: 0o600 },
      );
      console.log('365. local recovery email saved to .data/mail');
    },
  };
}
