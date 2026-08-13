import type { ModuleColumnPreference, UserModuleColumnPreferencesMap } from '@mms/shared';
import {
  CONTACTS_MODULE_MANIFEST,
  ENROLLMENTS_MODULE_MANIFEST,
  SESSIONS_MODULE_MANIFEST,
  STUDENTS_MODULE_MANIFEST,
  TEACHERS_MODULE_MANIFEST,
  USERS_MODULE_MANIFEST,
  ATTENDANCE_MODULE_MANIFEST,
  QUESTION_BANK_MODULE_MANIFEST,
  FINANCE_MODULE_MANIFEST,
  ACCOUNTING_MODULE_MANIFEST,
  EXAMINATIONS_MODULE_MANIFEST,
  HASANAT_MODULE_MANIFEST,
} from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  getContactUserColumnPrefs,
  setContactUserColumnPrefs,
} from '../db/repositories/contactUserColumnPrefsRepository.js';
import {
  getStudentUserColumnPrefs,
  setStudentUserColumnPrefs,
} from '../db/repositories/studentUserColumnPrefsRepository.js';
import {
  getTeacherUserColumnPrefs,
  setTeacherUserColumnPrefs,
} from '../db/repositories/teacherUserColumnPrefsRepository.js';
import {
  getSessionUserColumnPrefs,
  setSessionUserColumnPrefs,
} from '../db/repositories/sessionUserColumnPrefsRepository.js';
import {
  getEnrollmentUserColumnPrefs,
  setEnrollmentUserColumnPrefs,
} from '../db/repositories/enrollmentUserColumnPrefsRepository.js';
import {
  getUserUserColumnPrefs,
  setUserUserColumnPrefs,
} from '../db/repositories/userUserColumnPrefsRepository.js';
import {
  getFinanceUserColumnPrefs,
  setFinanceUserColumnPrefs,
} from '../db/repositories/financeUserColumnPrefsRepository.js';
import {
  getFinancePaymentUserColumnPrefs,
  setFinancePaymentUserColumnPrefs,
} from '../db/repositories/financePaymentUserColumnPrefsRepository.js';
import {
  getAccountingAccountUserColumnPrefs,
  setAccountingAccountUserColumnPrefs,
} from '../db/repositories/accountingAccountUserColumnPrefsRepository.js';
import {
  getAccountingJournalUserColumnPrefs,
  setAccountingJournalUserColumnPrefs,
} from '../db/repositories/accountingJournalUserColumnPrefsRepository.js';
import {
  getExaminationExamUserColumnPrefs,
  setExaminationExamUserColumnPrefs,
} from '../db/repositories/examinationExamUserColumnPrefsRepository.js';
import {
  getExaminationResultsUserColumnPrefs,
  setExaminationResultsUserColumnPrefs,
} from '../db/repositories/examinationResultsUserColumnPrefsRepository.js';
import {
  getQuestionBankUserColumnPrefs,
  setQuestionBankUserColumnPrefs,
} from '../db/repositories/questionBankUserColumnPrefsRepository.js';
import {
  getAttendanceUserColumnPrefs,
  setAttendanceUserColumnPrefs,
} from '../db/repositories/attendanceUserColumnPrefsRepository.js';
import {
  getHasanatDistributionUserColumnPrefs,
  setHasanatDistributionUserColumnPrefs,
} from '../db/repositories/hasanatDistributionUserColumnPrefsRepository.js';
import {
  getHasanatRedemptionUserColumnPrefs,
  setHasanatRedemptionUserColumnPrefs,
} from '../db/repositories/hasanatRedemptionUserColumnPrefsRepository.js';
import { fetchObject, persistObject } from './dbSyncService.js';

async function loadUserColumnPreferencesMap(objectKey: string): Promise<UserModuleColumnPreferencesMap> {
  const raw = await fetchObject(objectKey);
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as UserModuleColumnPreferencesMap;
  }
  return {};
}

async function saveUserColumnPreferencesMap(
  objectKey: string,
  preferencesByUser: UserModuleColumnPreferencesMap,
): Promise<void> {
  await persistObject(objectKey, preferencesByUser);
}

function filterPreferences(preferences: unknown[]): ModuleColumnPreference[] {
  return preferences.filter((preference): preference is ModuleColumnPreference => {
    if (preference == null || typeof preference !== 'object') return false;
    const record = preference as Record<string, unknown>;
    return (
      typeof record.key === 'string' &&
      typeof record.enabled === 'boolean' &&
      typeof record.order === 'number'
    );
  });
}

function isContactsColumnKey(objectKey: string): boolean {
  return objectKey === CONTACTS_MODULE_MANIFEST.columnPreferencesObjectKey;
}

function isStudentsColumnKey(objectKey: string): boolean {
  return objectKey === STUDENTS_MODULE_MANIFEST.columnPreferencesObjectKey;
}

function isTeachersColumnKey(objectKey: string): boolean {
  return objectKey === TEACHERS_MODULE_MANIFEST.columnPreferencesObjectKey;
}

function isSessionsColumnKey(objectKey: string): boolean {
  return objectKey === SESSIONS_MODULE_MANIFEST.columnPreferencesObjectKey;
}

function isEnrollmentsColumnKey(objectKey: string): boolean {
  return objectKey === ENROLLMENTS_MODULE_MANIFEST.columnPreferencesObjectKey;
}

function isUsersColumnKey(objectKey: string): boolean {
  return objectKey === USERS_MODULE_MANIFEST.columnPreferencesObjectKey;
}

function isAttendanceColumnKey(objectKey: string): boolean {
  return objectKey === ATTENDANCE_MODULE_MANIFEST.columnPreferencesObjectKey;
}

function isQuestionBankColumnKey(objectKey: string): boolean {
  return objectKey === QUESTION_BANK_MODULE_MANIFEST.columnPreferencesObjectKey;
}

function isFinanceInvoiceColumnKey(objectKey: string): boolean {
  return objectKey === FINANCE_MODULE_MANIFEST.invoiceColumnPreferencesObjectKey;
}

function isFinancePaymentColumnKey(objectKey: string): boolean {
  return objectKey === FINANCE_MODULE_MANIFEST.paymentColumnPreferencesObjectKey;
}

function isAccountingAccountColumnKey(objectKey: string): boolean {
  return objectKey === ACCOUNTING_MODULE_MANIFEST.accountColumnPreferencesObjectKey;
}

function isAccountingJournalColumnKey(objectKey: string): boolean {
  return objectKey === ACCOUNTING_MODULE_MANIFEST.journalColumnPreferencesObjectKey;
}

function isExaminationExamColumnKey(objectKey: string): boolean {
  return objectKey === EXAMINATIONS_MODULE_MANIFEST.examColumnPreferencesObjectKey;
}

function isExaminationResultsColumnKey(objectKey: string): boolean {
  return objectKey === EXAMINATIONS_MODULE_MANIFEST.resultsColumnPreferencesObjectKey;
}

function isHasanatDistributionColumnKey(objectKey: string): boolean {
  return objectKey === HASANAT_MODULE_MANIFEST.distributionColumnPreferencesObjectKey;
}

function isHasanatRedemptionColumnKey(objectKey: string): boolean {
  return objectKey === HASANAT_MODULE_MANIFEST.redemptionColumnPreferencesObjectKey;
}

function requireTenant(): string {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  return tenant.trim().toLowerCase();
}

export async function getUserColumnPreferencesForModule(
  objectKey: string,
  userId: string,
): Promise<ModuleColumnPreference[]> {
  if (isContactsColumnKey(objectKey)) {
    const prefs = await getContactUserColumnPrefs(requireTenant(), userId);
    return filterPreferences(prefs);
  }
  if (isStudentsColumnKey(objectKey)) {
    const prefs = await getStudentUserColumnPrefs(requireTenant(), userId);
    return filterPreferences(prefs);
  }
  if (isTeachersColumnKey(objectKey)) {
    const prefs = await getTeacherUserColumnPrefs(requireTenant(), userId);
    return filterPreferences(prefs);
  }
  if (isSessionsColumnKey(objectKey)) {
    const prefs = await getSessionUserColumnPrefs(requireTenant(), userId);
    return filterPreferences(prefs);
  }
  if (isEnrollmentsColumnKey(objectKey)) {
    const prefs = await getEnrollmentUserColumnPrefs(requireTenant(), userId);
    return filterPreferences(prefs);
  }
  if (isUsersColumnKey(objectKey)) {
    const prefs = await getUserUserColumnPrefs(requireTenant(), userId);
    return filterPreferences(prefs);
  }
  if (isAttendanceColumnKey(objectKey)) {
    const prefs = await getAttendanceUserColumnPrefs(requireTenant(), userId);
    return filterPreferences(prefs);
  }
  if (isQuestionBankColumnKey(objectKey)) {
    const prefs = await getQuestionBankUserColumnPrefs(requireTenant(), userId);
    return filterPreferences(prefs);
  }
  if (isFinanceInvoiceColumnKey(objectKey)) {
    const prefs = await getFinanceUserColumnPrefs(requireTenant(), userId);
    return filterPreferences(prefs);
  }
  if (isFinancePaymentColumnKey(objectKey)) {
    const prefs = await getFinancePaymentUserColumnPrefs(requireTenant(), userId);
    return filterPreferences(prefs);
  }
  if (isAccountingAccountColumnKey(objectKey)) {
    const prefs = await getAccountingAccountUserColumnPrefs(requireTenant(), userId);
    return filterPreferences(prefs);
  }
  if (isAccountingJournalColumnKey(objectKey)) {
    const prefs = await getAccountingJournalUserColumnPrefs(requireTenant(), userId);
    return filterPreferences(prefs);
  }
  if (isExaminationExamColumnKey(objectKey)) {
    const prefs = await getExaminationExamUserColumnPrefs(requireTenant(), userId);
    return filterPreferences(prefs);
  }
  if (isExaminationResultsColumnKey(objectKey)) {
    const prefs = await getExaminationResultsUserColumnPrefs(requireTenant(), userId);
    return filterPreferences(prefs);
  }
  if (isHasanatDistributionColumnKey(objectKey)) {
    const prefs = await getHasanatDistributionUserColumnPrefs(requireTenant(), userId);
    return filterPreferences(prefs);
  }
  if (isHasanatRedemptionColumnKey(objectKey)) {
    const prefs = await getHasanatRedemptionUserColumnPrefs(requireTenant(), userId);
    return filterPreferences(prefs);
  }
  const preferencesByUser = await loadUserColumnPreferencesMap(objectKey);
  const preferences = preferencesByUser[userId];
  if (!Array.isArray(preferences)) return [];
  return filterPreferences(preferences);
}

export async function setUserColumnPreferencesForModule(
  objectKey: string,
  userId: string,
  preferences: ModuleColumnPreference[],
): Promise<void> {
  if (isContactsColumnKey(objectKey)) {
    await setContactUserColumnPrefs(requireTenant(), userId, preferences);
    return;
  }
  if (isStudentsColumnKey(objectKey)) {
    await setStudentUserColumnPrefs(requireTenant(), userId, preferences);
    return;
  }
  if (isTeachersColumnKey(objectKey)) {
    await setTeacherUserColumnPrefs(requireTenant(), userId, preferences);
    return;
  }
  if (isSessionsColumnKey(objectKey)) {
    await setSessionUserColumnPrefs(requireTenant(), userId, preferences);
    return;
  }
  if (isEnrollmentsColumnKey(objectKey)) {
    await setEnrollmentUserColumnPrefs(requireTenant(), userId, preferences);
    return;
  }
  if (isUsersColumnKey(objectKey)) {
    await setUserUserColumnPrefs(requireTenant(), userId, preferences);
    return;
  }
  if (isAttendanceColumnKey(objectKey)) {
    await setAttendanceUserColumnPrefs(requireTenant(), userId, preferences);
    return;
  }
  if (isQuestionBankColumnKey(objectKey)) {
    await setQuestionBankUserColumnPrefs(requireTenant(), userId, preferences);
    return;
  }
  if (isFinanceInvoiceColumnKey(objectKey)) {
    await setFinanceUserColumnPrefs(requireTenant(), userId, preferences);
    return;
  }
  if (isFinancePaymentColumnKey(objectKey)) {
    await setFinancePaymentUserColumnPrefs(requireTenant(), userId, preferences);
    return;
  }
  if (isAccountingAccountColumnKey(objectKey)) {
    await setAccountingAccountUserColumnPrefs(requireTenant(), userId, preferences);
    return;
  }
  if (isAccountingJournalColumnKey(objectKey)) {
    await setAccountingJournalUserColumnPrefs(requireTenant(), userId, preferences);
    return;
  }
  if (isExaminationExamColumnKey(objectKey)) {
    await setExaminationExamUserColumnPrefs(requireTenant(), userId, preferences);
    return;
  }
  if (isExaminationResultsColumnKey(objectKey)) {
    await setExaminationResultsUserColumnPrefs(requireTenant(), userId, preferences);
    return;
  }
  if (isHasanatDistributionColumnKey(objectKey)) {
    await setHasanatDistributionUserColumnPrefs(requireTenant(), userId, preferences);
    return;
  }
  if (isHasanatRedemptionColumnKey(objectKey)) {
    await setHasanatRedemptionUserColumnPrefs(requireTenant(), userId, preferences);
    return;
  }
  const preferencesByUser = await loadUserColumnPreferencesMap(objectKey);
  preferencesByUser[userId] = preferences;
  await saveUserColumnPreferencesMap(objectKey, preferencesByUser);
}
