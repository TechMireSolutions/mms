import type { AppTranslationKey } from '@mms/shared';
import { toTitleCase } from '@mms/shared';

export function teacherStatusLabel(t: (key: AppTranslationKey) => string, status: string): string {
  const key = `teachers.status.${status}` as AppTranslationKey;
  const translatedStatus = t(key);
  return translatedStatus === key ? toTitleCase(status) : translatedStatus;
}
