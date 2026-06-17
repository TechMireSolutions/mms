import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface PlatformEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface PlatformEmailResult {
  sent: boolean;
  reason?: 'not_configured' | 'transport_error';
  message?: string;
}

function readEnv(name: string): string {
  return process.env[name]?.trim() ?? '';
}

/** True when platform-level SMTP env vars are set for apex emails. */
export function isPlatformSmtpConfigured(): boolean {
  const host = readEnv('PLATFORM_SMTP_HOST');
  const user = readEnv('PLATFORM_SMTP_USER');
  const pass = readEnv('PLATFORM_SMTP_PASS');
  const from = readEnv('PLATFORM_EMAIL_FROM');
  return Boolean(host && user && pass && from);
}

function createPlatformTransporter(): Transporter | null {
  if (!isPlatformSmtpConfigured()) return null;

  const port = Number(readEnv('PLATFORM_SMTP_PORT') || '587');
  const secure = readEnv('PLATFORM_SMTP_SECURE') === 'true';

  return nodemailer.createTransport({
    host: readEnv('PLATFORM_SMTP_HOST'),
    port: Number.isFinite(port) && port > 0 ? port : 587,
    secure,
    auth: {
      user: readEnv('PLATFORM_SMTP_USER'),
      pass: readEnv('PLATFORM_SMTP_PASS'),
    },
  });
}

/** Sends email via platform SMTP (apex bootstrap / verification — not tenant-scoped). */
export async function sendPlatformEmail(input: PlatformEmailInput): Promise<PlatformEmailResult> {
  const transporter = createPlatformTransporter();
  if (!transporter) {
    return { sent: false, reason: 'not_configured' };
  }

  const fromAddress = readEnv('PLATFORM_EMAIL_FROM');
  const fromName = readEnv('PLATFORM_EMAIL_FROM_NAME') || 'MMS Platform';

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html ?? `<p>${input.text.replace(/\n/g, '<br/>')}</p>`,
    });
    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send platform email';
    return { sent: false, reason: 'transport_error', message };
  }
}

/** Public apex URL for links in platform emails (reset password, etc.). */
export function resolvePlatformAppOrigin(): string {
  const configured = readEnv('PLATFORM_APP_URL') || readEnv('VITE_APP_URL');
  return (configured || 'http://localhost:5173').replace(/\/$/, '');
}

export interface PlatformVerificationEmailInput {
  email: string;
  code: string;
  subject: string;
  bodyLines: string[];
  ttlMinutes: number;
  logLabel: string;
}

/** Sends a platform OTP email or returns a dev-only code when SMTP is not configured. */
export async function dispatchPlatformVerificationEmail(
  input: PlatformVerificationEmailInput,
): Promise<{ sent: boolean; devCode?: string }> {
  const text = [
    ...input.bodyLines,
    '',
    input.code,
    '',
    `This code expires in ${input.ttlMinutes} minutes.`,
    'If you did not request this, you can ignore this email.',
  ].join('\n');

  const result = await sendPlatformEmail({
    to: input.email,
    subject: input.subject,
    text,
  });

  if (result.sent) {
    return { sent: true };
  }

  if (process.env.NODE_ENV !== 'production' && !isPlatformSmtpConfigured()) {
    console.info(`[MMS] ${input.logLabel} for ${input.email}: ${input.code}`);
    return { sent: false, devCode: input.code };
  }

  if (!isPlatformSmtpConfigured()) {
    throw new Error('Platform email is not configured');
  }

  throw new Error(result.message ?? 'Failed to send verification email');
}
