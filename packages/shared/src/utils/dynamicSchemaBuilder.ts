import { z } from 'zod';
import type { CustomFieldConfig } from '../schemas/dynamicFormSchemas.js';

export function buildDynamicValidationSchema(
  fields: CustomFieldConfig[]
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    if (!field.enabled) continue;

    let base: z.ZodTypeAny;

    switch (field.type) {
      case 'text':
      case 'textarea':
        base = z.string();
        break;

      case 'phone':
        // MMS Global standard: E.164 phone string validation
        base = z
          .string()
          .regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number (E.164 format required)');
        break;

      case 'email':
        base = z.string().email('Invalid email address');
        break;

      case 'url':
        base = z.string().url('Invalid URL');
        break;

      case 'number':
        base = z.number();
        if (field.minValue != null) base = (base as z.ZodNumber).min(field.minValue);
        if (field.maxValue != null) base = (base as z.ZodNumber).max(field.maxValue);
        break;

      case 'currency':
        // Money handled as decimal string to prevent IEEE-754 floating point precision bugs
        base = z
          .string()
          .regex(/^\d+(\.\d{1,2})?$/, 'Invalid monetary amount (e.g. 100 or 100.50)');
        break;

      case 'date':
        base = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD required)');
        break;

      case 'datetime':
        base = z.string().datetime({ offset: true });
        break;

      case 'boolean':
        base = z.boolean();
        break;

      case 'select': {
        const uniqueOptions = Array.from(new Set(field.options ?? [])).filter((opt): opt is string => Boolean(opt));
        if (uniqueOptions.length > 0) {
          const [first, ...rest] = uniqueOptions;
          base = z.enum([first, ...rest] as [string, ...string[]]);
        } else {
          base = z.string();
        }
        break;
      }

      case 'tags': {
        const uniqueOptions = Array.from(new Set(field.options ?? [])).filter((opt): opt is string => Boolean(opt));
        if (uniqueOptions.length > 0) {
          const [first, ...rest] = uniqueOptions;
          base = z.array(z.enum([first, ...rest] as [string, ...string[]]));
        } else {
          base = z.array(z.string());
        }
        break;
      }

      case 'rating':
        base = z.number().int().min(1).max(5);
        break;

      case 'file':
        base = z.object({
          url: z.string().url(),
          name: z.string(),
          size: z.number().max(field.maxFileSize ?? 10 * 1024 * 1024),
        });
        break;

      default:
        base = z.unknown();
    }

    if (field.required) {
      if (field.type === 'boolean') {
        base = base.refine((val) => val === true, { message: `${field.label} is required` });
      } else if (field.type === 'tags') {
        base = (base as z.ZodArray<any>).min(1, `${field.label} requires at least one selection`);
      } else if (typeof (base as any).min === 'function') {
        base = (base as any).min(1, `${field.label} is required`);
      }
    } else {
      base = z.preprocess((val) => (val === '' ? null : val), base.optional().nullable());
    }

    shape[field.key] = base;
  }

  return z.object(shape);
}

