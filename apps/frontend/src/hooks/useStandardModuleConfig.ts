import { useMemo } from 'react';
import type { ModuleFieldDef } from '@mms/shared';
import { useModuleConfig } from './useModuleConfig';
import { useLiveCollectionsAndObjects } from './useLiveCollectionsAndObjects';
import {
  STANDARD_MODULES_CONFIG_REGISTRY,
  type StandardModuleConfigExtraMap,
  type StandardModuleId,
  type StandardModuleSettingsMap,
} from './standardModuleConfigRegistry';

export type {
  StudentGuardianContactDefault,
  StudentGuardianContactDefaults,
  StandardModuleId,
  StandardModuleSettingsMap,
  StandardModuleConfigExtraMap,
} from './standardModuleConfigRegistry';
export { STANDARD_MODULES_CONFIG_REGISTRY } from './standardModuleConfigRegistry';
export { useLiveCollectionsAndObjects } from './useLiveCollectionsAndObjects';

export function useStandardModuleConfig<M extends StandardModuleId>(
  moduleId: M,
): ReturnType<typeof useModuleConfig<StandardModuleSettingsMap[M]>> &
  StandardModuleConfigExtraMap[M] {
  const config = STANDARD_MODULES_CONFIG_REGISTRY[moduleId];

  const defaultFieldDefs = useMemo(() => {
    if (moduleId === 'teachers') {
      return (config.defaultFieldDefs as unknown as ModuleFieldDef[]).map((field) => ({
        ...field,
        label: field.label || (field as { labelKey?: string }).labelKey || field.id,
      }));
    }
    return config.defaultFieldDefs as unknown as ModuleFieldDef[];
  }, [moduleId, config.defaultFieldDefs]);

  const moduleConfigResult = useModuleConfig<StandardModuleSettingsMap[M]>({
    settingsObjectKey: config.settingsObjectKey,
    defaultSettings: config.defaultSettings as unknown as StandardModuleSettingsMap[M],
    defaultFieldDefs,
    normalizeFn: 'normalizeFn' in config ? (config.normalizeFn as unknown as (settings: unknown) => StandardModuleSettingsMap[M]) : undefined,
  });

  const aux = useLiveCollectionsAndObjects(
    'collections' in config ? (config.collections as Record<string, { dbKey: string; default: () => unknown[] }>) : undefined,
    'objects' in config ? (config.objects as Record<string, { dbKey: string; default: () => unknown }>) : undefined,
  );

  return {
    ...moduleConfigResult,
    ...aux.collections,
    ...aux.objects,
  } as ReturnType<typeof useModuleConfig<StandardModuleSettingsMap[M]>> &
    StandardModuleConfigExtraMap[M];
}

export function useUsersConfig() {
  return useStandardModuleConfig('users');
}

export function useTeacherConfig() {
  return useStandardModuleConfig('teachers');
}

export function useStudentConfig() {
  return useStandardModuleConfig('students');
}

export function useSessionConfig() {
  return useStandardModuleConfig('sessions');
}

export function useExaminationConfig() {
  return useStandardModuleConfig('examinations');
}

export function useHasanatConfig() {
  return useStandardModuleConfig('hasanat');
}

export function useEnrollmentConfig() {
  return useStandardModuleConfig('enrollments');
}

export function useFinanceConfig() {
  return useStandardModuleConfig('finance');
}

export function useAccountingConfig() {
  return useStandardModuleConfig('accounting');
}

export function useAttendanceConfig() {
  return useStandardModuleConfig('attendance');
}
