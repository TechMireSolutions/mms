import { z } from "zod";
import type { FieldDefinition } from "./contactTypes.js";

const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

const TEXT_LIKE_FIELD_TYPES: ReadonlySet<FieldDefinition['type']> = new Set([
  "text",
  "textarea",
  "email",
  "url",
  "date",
  "datetime",
  "select",
  "single_select",
  "currency",
]);

function isValidOption(options: unknown[], targetValue: string): boolean {
  const normalizedTarget = targetValue.trim().toLowerCase();
  return options.some((option) =>
    typeof option === "string" && option.trim().toLowerCase() === normalizedTarget
  );
}

/** Absolute URL, scheme-less domain/path, or @handle / username. */
export function isUrlOrSocialHandle(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (/\s/.test(trimmed)) return false;
  if (/^https?:\/\/\S+$/i.test(trimmed)) return true;
  if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}([/?#]\S*)?$/i.test(trimmed)) return true;
  if (/^@[\w][\w.-]*$/.test(trimmed)) return true;
  return /^[\w][\w.-]*(\/[\w./-]*)?$/.test(trimmed);
}

/** Compiles a dynamic field validator from its field definition. */
export function buildCustomFieldSchema(fieldDefinition: FieldDefinition): z.ZodTypeAny {
  let baseSchema: z.ZodTypeAny;

  switch (fieldDefinition.type) {
    case "text":
    case "textarea": {
      let stringSchema = z.string();
      if (fieldDefinition.minLength !== undefined) {
        stringSchema = stringSchema.min(
          fieldDefinition.minLength,
          `${fieldDefinition.label} must be at least ${fieldDefinition.minLength} characters.`,
        );
      }
      if (fieldDefinition.maxLength !== undefined) {
        stringSchema = stringSchema.max(
          fieldDefinition.maxLength,
          `${fieldDefinition.label} must be at most ${fieldDefinition.maxLength} characters.`,
        );
      }
      baseSchema = stringSchema;
      break;
    }
    case "number": {
      let numberSchema = z.coerce.number({
        message: `${fieldDefinition.label} must be a number.`,
      });
      if (fieldDefinition.min !== undefined) {
        numberSchema = numberSchema.min(
          fieldDefinition.min,
          `${fieldDefinition.label} must be at least ${fieldDefinition.min}.`,
        );
      }
      if (fieldDefinition.max !== undefined) {
        numberSchema = numberSchema.max(
          fieldDefinition.max,
          `${fieldDefinition.label} must be at most ${fieldDefinition.max}.`,
        );
      }
      baseSchema = numberSchema;
      break;
    }
    case "email":
      baseSchema = z.string().regex(EMAIL_RE, { message: "isNotValidEmail" });
      break;
    case "url":
      baseSchema = z.string().refine(isUrlOrSocialHandle, {
        message: `${fieldDefinition.label} is not a valid URL or handle.`,
      });
      break;
    case "date":
      baseSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
        message: `${fieldDefinition.label} is not a valid date.`,
      });
      break;
    case "datetime":
      baseSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
        message: `${fieldDefinition.label} is not a valid date/time.`,
      });
      break;
    case "currency": {
      let currencySchema = z.string().refine(
        (value) => !value || !Number.isNaN(Number(value)),
        { message: `${fieldDefinition.label} must be a valid numeric string.` },
      );
      if (fieldDefinition.precision !== undefined) {
        const precision = fieldDefinition.precision;
        currencySchema = currencySchema.refine(
          (value) => !value || (value.split('.')[1] ?? '').length <= precision,
          { message: `Precision exceeded. Max allowed is ${precision} decimal places.` },
        );
      }
      baseSchema = currencySchema;
      break;
    }
    case "select":
    case "single_select":
      baseSchema = fieldDefinition.options?.length
        ? z.string().refine(
            (value) => !value || isValidOption(fieldDefinition.options ?? [], value),
            { message: `${fieldDefinition.label} must be one of the allowed options.` },
          )
        : z.string();
      break;
    case "multiselect":
    case "multi_select":
      baseSchema = fieldDefinition.options?.length
        ? z.array(z.string()).refine(
            (values) => values.every((value) =>
              isValidOption(fieldDefinition.options ?? [], value)
            ),
            { message: `${fieldDefinition.label} contains invalid options.` },
          )
        : z.array(z.string());
      break;
    case "tags":
      baseSchema = z.union([z.array(z.string()), z.string()]);
      break;
    case "boolean":
      baseSchema = z.coerce.boolean();
      break;
    case "file":
      baseSchema = z.union([
        z.string(),
        z.object({
          name: z.string(),
          url: z.string(),
          size: z.number().optional(),
          type: z.string().optional(),
        }),
      ]);
      break;
    case "location":
      baseSchema = z.object({
        lat: z.number(),
        lng: z.number(),
        address: z.string().optional(),
      });
      break;
    case "ai_summary":
      baseSchema = z.string().optional();
      break;
    default:
      baseSchema = z.unknown();
  }

  if (!fieldDefinition.required) {
    return z.preprocess(
      (value) => value === "" || value === null || value === undefined ? undefined : value,
      baseSchema.optional(),
    );
  }

  if (TEXT_LIKE_FIELD_TYPES.has(fieldDefinition.type)) {
    return baseSchema.refine(
      (value) => typeof value === "string" && value.trim() !== "",
      { message: `${fieldDefinition.label} is required.` },
    );
  }
  if (fieldDefinition.type === "multiselect" || fieldDefinition.type === "multi_select") {
    return baseSchema.refine(
      (value) => Array.isArray(value) && value.length > 0,
      { message: `${fieldDefinition.label} is required.` },
    );
  }
  if (fieldDefinition.type === "number") {
    return baseSchema.refine(
      (value) => value !== null && value !== undefined && !Number.isNaN(value as number),
      { message: `${fieldDefinition.label} is required.` },
    );
  }
  if (fieldDefinition.type === "boolean") {
    return baseSchema.refine((value) => value === true, {
      message: `${fieldDefinition.label} is required.`,
    });
  }
  if (fieldDefinition.type === "tags") {
    return baseSchema.refine(
      (value) => Array.isArray(value)
        ? value.length > 0
        : typeof value === "string" && value.trim() !== "",
      { message: `${fieldDefinition.label} is required.` },
    );
  }
  return baseSchema;
}
