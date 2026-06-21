import { z } from 'zod';

export const loginBodySchema = z.object({
  email: z.string().min(3),
  password: z.string().min(6),
});

export const onboardBodySchema = z.object({
  madrasaName: z.string().min(1),
  adminName: z.string().min(1),
  email: z.string().min(3),
  password: z.string().min(6),
  subdomain: z.string().min(2),
  tagline: z.string().optional(),
  country: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  logoUrl: z.string().optional(),
  adminPhone: z.string().optional(),
  website: z.string().optional(),
  footerText: z.string().optional(),
});
