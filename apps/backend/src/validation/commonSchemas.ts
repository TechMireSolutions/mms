import { z } from 'zod';

export const resourceIdParamsSchema = z.object({ id: z.string().min(1) });
export const resourceNameParamsSchema = z.object({ name: z.string().min(1) });
export const resourceKeyParamsSchema = z.object({ key: z.string().min(1) });
export const subdomainParamsSchema = z.object({ subdomain: z.string().min(1) });

export const challengeCodeBodySchema = z.object({
  challengeId: z.string().min(1),
  code: z.string().min(1),
});

export const challengeIdBodySchema = z.object({
  challengeId: z.string().min(1),
});

export const handoffBodySchema = z.object({
  code: z.string().min(1),
});
