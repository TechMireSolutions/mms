import type { ExaminationsSettings } from "@mms/shared";

export const EXAMINATION_CONFIG_COLLECTION_KEYS = {} as const;

export interface ExaminationConfigDefaults {
  settings: ExaminationsSettings;
}
