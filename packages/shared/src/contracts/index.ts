import { initContract } from '@ts-rest/core';
import { studentContract } from './students.contract.js';
import { financeContract } from './finance.contract.js';
import { attendanceContract } from './attendance.contract.js';
import { contactsContract } from './contacts.contract.js';
import { teacherContract } from './teachers.contract.js';
import { userContract } from './users.contract.js';
import { messagingContract } from './messaging.contract.js';
import { sessionContract } from './sessions.contract.js';
import { questionBankContract } from './questionBank.contract.js';
import { accountingContract } from './accounting.contract.js';
import { hasanatContract } from './hasanat.contract.js';
import { obligationContract } from './obligations.contract.js';
import { examinationContract } from './examinations.contract.js';
import { enrollmentContract } from './enrollments.contract.js';
import { dashboardContract } from './dashboard.contract.js';
import { savedReportsContract } from './savedReports.contract.js';
import { workspaceContract } from './workspace.contract.js';
import { authContract } from './auth.contract.js';
import { profileContract } from './profile.contract.js';
import { publicContract } from './public.contract.js';
import { aiContract } from './ai.contract.js';
import { platformContract } from './platform.contract.js';

const c = initContract();

export const rootContract = c.router({
  students: studentContract,
  finance: financeContract,
  attendance: attendanceContract,
  contacts: contactsContract,
  teachers: teacherContract,
  users: userContract,
  messaging: messagingContract,
  sessions: sessionContract,
  questionBank: questionBankContract,
  accounting: accountingContract,
  hasanat: hasanatContract,
  obligations: obligationContract,
  examinations: examinationContract,
  enrollments: enrollmentContract,
  dashboard: dashboardContract,
  savedReports: savedReportsContract,
  workspace: workspaceContract,
  auth: authContract,
  profile: profileContract,
  public: publicContract,
  ai: aiContract,
  platform: platformContract,
});

export type RootContract = typeof rootContract;

/**
 * Per-domain contracts, re-exported so consumers can type a single domain
 * at a time. The full `rootContract` (22 domains × ~350 endpoints) exceeds
 * TS's union-instantiation depth limit — domain-scoped resolution keeps
 * compile-time types intact (see apps/frontend/src/lib/api.ts `tsr` accessor).
 */
export {
  studentContract,
  financeContract,
  attendanceContract,
  contactsContract,
  teacherContract,
  userContract,
  messagingContract,
  sessionContract,
  questionBankContract,
  accountingContract,
  hasanatContract,
  obligationContract,
  examinationContract,
  enrollmentContract,
  dashboardContract,
  savedReportsContract,
  workspaceContract,
  authContract,
  profileContract,
  publicContract,
  aiContract,
  platformContract,
};
export type DomainContracts = {
  students: typeof studentContract;
  finance: typeof financeContract;
  attendance: typeof attendanceContract;
  contacts: typeof contactsContract;
  teachers: typeof teacherContract;
  users: typeof userContract;
  messaging: typeof messagingContract;
  sessions: typeof sessionContract;
  questionBank: typeof questionBankContract;
  accounting: typeof accountingContract;
  hasanat: typeof hasanatContract;
  obligations: typeof obligationContract;
  examinations: typeof examinationContract;
  enrollments: typeof enrollmentContract;
  dashboard: typeof dashboardContract;
  savedReports: typeof savedReportsContract;
  workspace: typeof workspaceContract;
  auth: typeof authContract;
  profile: typeof profileContract;
  public: typeof publicContract;
  ai: typeof aiContract;
  platform: typeof platformContract;
};
