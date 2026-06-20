import {
  DEFAULT_GLOBAL_SETTINGS,
  mergeGlobalSettings,
  normalizeDateFormat,
  normalizePasswordPolicy,
  normalizeSessionTimeout,
  normalizeTimezone,
  type DateFormatId,
  type GlobalSettings,
} from '@mms/shared';
import { getGlobalSettings } from '@/lib/db';

/** Fields from the global settings draft that participate in live preview. */
export function globalSettingsPreviewPatch(draft: GlobalSettings): Partial<GlobalSettings> {
  return {
    language: draft.language,
    timezone: normalizeTimezone(draft.timezone, DEFAULT_GLOBAL_SETTINGS.timezone),
    dateFormat: normalizeDateFormat(
      draft.dateFormat,
      DEFAULT_GLOBAL_SETTINGS.dateFormat as DateFormatId,
    ),
    emailNotifications: draft.emailNotifications,
    smsNotifications: draft.smsNotifications,
    twoFactor: draft.twoFactor,
    sessionTimeout: normalizeSessionTimeout(draft.sessionTimeout),
    passwordPolicy: normalizePasswordPolicy(draft.passwordPolicy),
  };
}

/** Merge draft preview fields into persisted global settings for Save. */
export function mergeGlobalSettingsDraft(draft: GlobalSettings): GlobalSettings {
  return mergeGlobalSettings({
    ...getGlobalSettings(),
    ...globalSettingsPreviewPatch(draft),
  });
}
