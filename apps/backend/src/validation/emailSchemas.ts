import { z } from 'zod';

export const emailIntegrationBodySchema = z.object({
  providerId: z.string().min(1),
  fromAddress: z.string().min(3),
  fromName: z.string().optional(),
  smtpUsername: z.string().min(1),
  smtpPassword: z.string().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpSecure: z.boolean().optional(),
});

export const verificationCodeBodySchema = z.object({
  code: z.string().min(4).max(12),
});
