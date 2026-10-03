/**
 * @file taskSettingsService.ts
 * @description Tenant-scoped Task module settings storage and retrieval.
 */

import {
  DEFAULT_TASK_SETTINGS,
  taskSettingsSchema,
  type TaskSettings,
  TASKS_MODULE_MANIFEST,
} from '@mms/shared';
import { getObject, saveObject } from '../db/database.js';

export async function getTenantTaskSettings(): Promise<TaskSettings> {
  const data = await getObject(TASKS_MODULE_MANIFEST.preferencesObjectKey);
  if (!data) return DEFAULT_TASK_SETTINGS;
  const parsed = taskSettingsSchema.safeParse(data);
  return parsed.success ? parsed.data : DEFAULT_TASK_SETTINGS;
}

export async function updateTenantTaskSettings(payload: unknown): Promise<TaskSettings> {
  const parsed = taskSettingsSchema.parse(payload);
  await saveObject(TASKS_MODULE_MANIFEST.preferencesObjectKey, parsed);
  return parsed;
}
