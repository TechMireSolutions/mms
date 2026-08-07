import { sql, type SQL } from 'drizzle-orm';
import { contacts } from '../schema.js';
import { jsonbCustomDataFieldNonEmptySql } from './jsonbFieldUsage.js';

/** JSONB array path, or empty array when missing/non-array (avoids jsonb_array_elements errors). */
export function jsonbArrayOrEmpty(field: 'phones' | 'emails' | 'addresses'): SQL {
  return sql`(CASE
    WHEN jsonb_typeof(${contacts.customData}->${field}) = 'array'
    THEN ${contacts.customData}->${field}
    ELSE '[]'::jsonb
  END)`;
}

/** Primary dialable phone digits: phones[] (isPrimary first) then scalar phone. */
export function primaryPhoneDigitsSql(): SQL {
  return sql`COALESCE(
    NULLIF((
      SELECT regexp_replace(
        CASE
          WHEN NULLIF(trim(phone.value->>'number'), '') LIKE '+%'
            THEN trim(phone.value->>'number')
          ELSE concat_ws(
            '',
            NULLIF(trim(phone.value->>'countryCode'), ''),
            NULLIF(trim(phone.value->>'number'), '')
          )
        END,
        '[^0-9]',
        '',
        'g'
      )
      FROM jsonb_array_elements(${jsonbArrayOrEmpty('phones')}) AS phone(value)
      WHERE NULLIF(trim(phone.value->>'number'), '') IS NOT NULL
      ORDER BY CASE WHEN COALESCE((phone.value->>'isPrimary')::boolean, false) THEN 0 ELSE 1 END
      LIMIT 1
    ), ''),
    NULLIF(regexp_replace(COALESCE(${contacts.customData}->>'phone', ''), '[^0-9]', '', 'g'), ''),
    ''
  )`;
}

/** True when contact has a non-empty primary/legacy phone number in JSONB. */
export function hasPhoneSql(): SQL {
  return sql`(
    NULLIF(trim(COALESCE(${contacts.customData}->>'phone', '')), '') IS NOT NULL
    OR EXISTS (
      SELECT 1
      FROM jsonb_array_elements(${jsonbArrayOrEmpty('phones')}) AS phone(value)
      WHERE NULLIF(trim(phone.value->>'number'), '') IS NOT NULL
    )
  )`;
}

/** True when contact has a non-empty primary/legacy email in JSONB. */
export function hasEmailSql(): SQL {
  return sql`(
    NULLIF(trim(COALESCE(${contacts.customData}->>'email', '')), '') IS NOT NULL
    OR EXISTS (
      SELECT 1
      FROM jsonb_array_elements(${jsonbArrayOrEmpty('emails')}) AS email(value)
      WHERE NULLIF(trim(email.value->>'address'), '') IS NOT NULL
    )
  )`;
}

/**
 * WhatsApp eligibility approx: dialable digit length 8–15 on primary phone
 * (aligns with PuppeteerWhatsAppProvider.getNumberId bounds).
 */
export function hasWhatsAppSql(): SQL {
  return sql`(length(${primaryPhoneDigitsSql()}) BETWEEN 8 AND 15)`;
}

/**
 * Non-empty custom_data value for a field key — mirrors
 * `@mms/shared` `countContactsWithFieldValue` (string trim, array length, other types count).
 */
export function contactFieldNonEmptySql(fieldKey: string): SQL {
  return jsonbCustomDataFieldNonEmptySql(contacts.customData, fieldKey);
}
