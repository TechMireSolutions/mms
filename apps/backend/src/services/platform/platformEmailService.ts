import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { isBlockedHostname } from '../../lib/outboundUrl.js';
import { logger } from '../../lib/logger.js';

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

function isPlatformSmtpTransportConfigured(): boolean {
  const host = readEnv('PLATFORM_SMTP_HOST');
  const user = readEnv('PLATFORM_SMTP_USER');
  const pass = readEnv('PLATFORM_SMTP_PASS');
  const from = readEnv('PLATFORM_EMAIL_FROM');
  return Boolean(host && user && pass && from);
}

function isPlatformResendConfigured(): boolean {
  return Boolean(readEnv('PLATFORM_RESEND_API_KEY') && readEnv('PLATFORM_EMAIL_FROM'));
}

/** True when platform email can be sent (Resend API or SMTP + from address). */
export function isPlatformSmtpConfigured(): boolean {
  return isPlatformResendConfigured() || isPlatformSmtpTransportConfigured();
}

function platformFromHeader(): string {
  const fromAddress = readEnv('PLATFORM_EMAIL_FROM');
  const fromName = readEnv('PLATFORM_EMAIL_FROM_NAME') || 'MMS Platform';
  return `"${fromName}" <${fromAddress}>`;
}

async function sendViaResend(input: PlatformEmailInput): Promise<PlatformEmailResult> {
  const apiKey = readEnv('PLATFORM_RESEND_API_KEY');
  if (!apiKey || !readEnv('PLATFORM_EMAIL_FROM')) {
    return { sent: false, reason: 'not_configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: platformFromHeader(),
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html ?? `<p>${input.text.replace(/\n/g, '<br/>')}</p>`,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      return {
        sent: false,
        reason: 'transport_error',
        message: body || `Resend API failed (${response.status})`,
      };
    }

    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Resend request failed';
    return { sent: false, reason: 'transport_error', message };
  }
}

function createPlatformTransporter(): Transporter | null {
  if (!isPlatformSmtpTransportConfigured()) return null;

  const host = readEnv('PLATFORM_SMTP_HOST');
  // SSRF guard: never connect SMTP to private / link-local / loopback hosts.
  if (isBlockedHostname(host)) return null;

  const port = Number(readEnv('PLATFORM_SMTP_PORT') || '587');
  const secure = readEnv('PLATFORM_SMTP_SECURE') === 'true';

  return nodemailer.createTransport({
    host,
    port: Number.isFinite(port) && port > 0 ? port : 587,
    secure,
    auth: {
      user: readEnv('PLATFORM_SMTP_USER'),
      pass: readEnv('PLATFORM_SMTP_PASS'),
    },
  });
}

async function sendViaSmtp(input: PlatformEmailInput): Promise<PlatformEmailResult> {
  const transporter = createPlatformTransporter();
  if (!transporter) {
    return { sent: false, reason: 'not_configured' };
  }

  try {
    await transporter.sendMail({
      from: platformFromHeader(),
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

/** Sends apex platform email via Resend (preferred) or SMTP. */
export async function sendPlatformEmail(input: PlatformEmailInput): Promise<PlatformEmailResult> {
  if (isPlatformResendConfigured()) {
    return sendViaResend(input);
  }
  return sendViaSmtp(input);
}

/** Public apex URL for links in platform emails (reset password, etc.). */
export function resolvePlatformAppOrigin(): string {
  const configured = readEnv('PLATFORM_APP_URL') || readEnv('VITE_APP_URL');
  if (configured) return configured.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'production') {
    // Fail closed rather than emailing links that point at localhost.
    throw new Error('PLATFORM_APP_URL is required in production for platform email links');
  }
  return 'http://localhost:5173';
}

export interface PlatformVerificationEmailInput {
  email: string;
  code: string;
  subject: string;
  bodyLines: string[];
  ttlMinutes: number;
  logLabel: string;
}

function isProductionNodeEnv(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Sends a platform OTP email.
 * Production: never returns or logs the OTP — callers must fail closed when `sent` is false.
 * Non-production: may return `devCode` so local setup works without SMTP.
 */
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

  try {
    const result = await sendPlatformEmail({
      to: input.email,
      subject: input.subject,
      text,
    });

    if (result.sent) {
      return { sent: true };
    }

    const detail = result.message || 'unknown';
    if (isProductionNodeEnv()) {
      logger.warn({ email: input.email, detail, label: input.logLabel }, 'email delivery failed');
      return { sent: false };
    }

    logger.warn({ email: input.email, code: input.code, detail, label: input.logLabel }, 'email delivery failed (dev)');
    return { sent: false, devCode: input.code };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    if (isProductionNodeEnv()) {
      logger.warn({ email: input.email, detail, label: input.logLabel }, 'email delivery threw');
      return { sent: false };
    }

    logger.warn({ email: input.email, code: input.code, detail, label: input.logLabel }, 'email delivery threw (dev)');
    return { sent: false, devCode: input.code };
  }
}
