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
