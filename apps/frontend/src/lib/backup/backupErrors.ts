import type { AppTranslationKey } from '@mms/shared';

export function isBackupErrorKey(message: string): message is AppTranslationKey {
  return message.startsWith('backup.');
}
