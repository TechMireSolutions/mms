import { relations } from "drizzle-orm";

import { workspaces, platformUsers, platformUserPermissions, platformActivityLogs } from "./platform.js";
import { backgroundJobs, savedReports, auditLogEntries, userActivityLogs } from "./system.js";
import { contacts, contactTags, contactPhones, contactEmails, contactAddresses, contactSocials, contactEducations, contactExperiences, contactSkills, contactRelationships, contactActivities, contactAttachments, tenantUsers } from "./contacts.js";
import { students, studentEnrolledSessions } from "./students.js";
import { teachers } from "./teachers.js";
import { sessions, sessionClasses, sessionTimetable, sessionDiscounts, sessionBudgetExpenses, sessionBudgetIncomes, sessionEvents, sessionTabarruk } from "./sessions.js";
import { attendance, attendanceLeaves } from "./attendance.js";
import { enrollments, enrollmentTimelineEvents } from "./enrollments.js";
import { financeInvoices, financePayments } from "./finance.js";
import { accountingAccounts, accountingFiscalYears, accountingEntries, accountingJournalLines, accountingEntryTags, accountingEntryAttachments } from "./accounting.js";
import { exams, examClasses, examResults, questions, questionCategories, questionOptions, questionTags, questionCitations, tests, testQuestions, testSections, testSectionQuestions, assessmentResults, assessmentAnswers } from "./examinations.js";
import { obligationTypes, mujtahids, mujtahidReps, wakalaTypes, obligationDistributions, obligationCollections } from "./obligations.js";
import { hasanatDenoms, hasanatBatches, hasanatDistributions, hasanatRedemptions } from "./hasanat.js";
import { messageTemplates, messageLogs } from "./messaging.js";
import { dashboardPreferences, dashboardWidgets } from "./dashboard.js";


/* ========================================================================= */
/*                      DRIZZLE RELATIONS DEFINITIONS                        */
/* ========================================================================= */

export const platformUsersRelations = relations(platformUsers, ({ many }) => ({
  permissions: many(platformUserPermissions),
  activityLogs: many(platformActivityLogs),
}));

export const platformUserPermissionsRelations = relations(platformUserPermissions, ({ one }) => ({
  user: one(platformUsers, {
    fields: [platformUserPermissions.platformUserId],
    references: [platformUsers.id],
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [attendance.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  student: one(students, {
    fields: [attendance.workspaceSubdomain, attendance.studentId],
    references: [students.workspaceSubdomain, students.id],
  }),
}));

export const attendanceLeavesRelations = relations(attendanceLeaves, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [attendanceLeaves.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  student: one(students, {
    fields: [attendanceLeaves.workspaceSubdomain, attendanceLeaves.studentId],
    references: [students.workspaceSubdomain, students.id],
  }),
}));

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [enrollments.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  student: one(students, {
    fields: [enrollments.workspaceSubdomain, enrollments.studentId],
    references: [students.workspaceSubdomain, students.id],
  }),
  session: one(sessions, {
    fields: [enrollments.workspaceSubdomain, enrollments.sessionId],
    references: [sessions.workspaceSubdomain, sessions.id],
  }),
  timelineEvents: many(enrollmentTimelineEvents),
}));

export const enrollmentTimelineEventsRelations = relations(enrollmentTimelineEvents, ({ one }) => ({
  enrollment: one(enrollments, {
    fields: [enrollmentTimelineEvents.workspaceSubdomain, enrollmentTimelineEvents.enrollmentId],
    references: [enrollments.workspaceSubdomain, enrollments.id],
  }),
}));

export const financeInvoicesRelations = relations(financeInvoices, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [financeInvoices.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  student: one(students, {
    fields: [financeInvoices.workspaceSubdomain, financeInvoices.studentId],
    references: [students.workspaceSubdomain, students.id],
  }),
  payments: many(financePayments),
}));

export const financePaymentsRelations = relations(financePayments, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [financePayments.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  invoice: one(financeInvoices, {
    fields: [financePayments.workspaceSubdomain, financePayments.invoiceId],
    references: [financeInvoices.workspaceSubdomain, financeInvoices.id],
  }),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [exams.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  classes: many(examClasses),
  results: many(examResults),
}));

export const examClassesRelations = relations(examClasses, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [examClasses.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  exam: one(exams, {
    fields: [examClasses.workspaceSubdomain, examClasses.examId],
    references: [exams.workspaceSubdomain, exams.id],
  }),
}));

export const examResultsRelations = relations(examResults, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [examResults.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  exam: one(exams, {
    fields: [examResults.workspaceSubdomain, examResults.examId],
    references: [exams.workspaceSubdomain, exams.id],
  }),
  student: one(students, {
    fields: [examResults.workspaceSubdomain, examResults.studentId],
    references: [students.workspaceSubdomain, students.id],
  }),
}));

export const hasanatDenomsRelations = relations(hasanatDenoms, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [hasanatDenoms.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  batches: many(hasanatBatches),
  distributions: many(hasanatDistributions),
}));

export const hasanatBatchesRelations = relations(hasanatBatches, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [hasanatBatches.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  denomination: one(hasanatDenoms, {
    fields: [hasanatBatches.workspaceSubdomain, hasanatBatches.denominationId],
    references: [hasanatDenoms.workspaceSubdomain, hasanatDenoms.id],
  }),
  distributions: many(hasanatDistributions),
}));

export const hasanatDistributionsRelations = relations(hasanatDistributions, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [hasanatDistributions.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  batch: one(hasanatBatches, {
    fields: [hasanatDistributions.workspaceSubdomain, hasanatDistributions.batchId],
    references: [hasanatBatches.workspaceSubdomain, hasanatBatches.id],
  }),
  denomination: one(hasanatDenoms, {
    fields: [hasanatDistributions.workspaceSubdomain, hasanatDistributions.denominationId],
    references: [hasanatDenoms.workspaceSubdomain, hasanatDenoms.id],
  }),
  recipientStudent: one(students, {
    fields: [hasanatDistributions.workspaceSubdomain, hasanatDistributions.recipientStudentId],
    references: [students.workspaceSubdomain, students.id],
  }),
  recipientTeacher: one(teachers, {
    fields: [hasanatDistributions.workspaceSubdomain, hasanatDistributions.recipientTeacherId],
    references: [teachers.workspaceSubdomain, teachers.id],
  }),
  redemptions: many(hasanatRedemptions),
}));

export const hasanatRedemptionsRelations = relations(hasanatRedemptions, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [hasanatRedemptions.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  distribution: one(hasanatDistributions, {
    fields: [hasanatRedemptions.workspaceSubdomain, hasanatRedemptions.distributionId],
    references: [hasanatDistributions.workspaceSubdomain, hasanatDistributions.id],
  }),
}));

export const accountingAccountsRelations = relations(accountingAccounts, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [accountingAccounts.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  lines: many(accountingJournalLines),
}));

export const accountingFiscalYearsRelations = relations(accountingFiscalYears, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [accountingFiscalYears.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
}));

export const accountingEntriesRelations = relations(accountingEntries, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [accountingEntries.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  lines: many(accountingJournalLines),
  tags: many(accountingEntryTags),
  attachments: many(accountingEntryAttachments),
}));

export const accountingJournalLinesRelations = relations(accountingJournalLines, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [accountingJournalLines.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  entry: one(accountingEntries, {
    fields: [accountingJournalLines.workspaceSubdomain, accountingJournalLines.entryId],
    references: [accountingEntries.workspaceSubdomain, accountingEntries.id],
  }),
  account: one(accountingAccounts, {
    fields: [accountingJournalLines.workspaceSubdomain, accountingJournalLines.accountId],
    references: [accountingAccounts.workspaceSubdomain, accountingAccounts.id],
  }),
}));

export const accountingEntryTagsRelations = relations(accountingEntryTags, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [accountingEntryTags.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  entry: one(accountingEntries, {
    fields: [accountingEntryTags.workspaceSubdomain, accountingEntryTags.entryId],
    references: [accountingEntries.workspaceSubdomain, accountingEntries.id],
  }),
}));

export const accountingEntryAttachmentsRelations = relations(accountingEntryAttachments, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [accountingEntryAttachments.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  entry: one(accountingEntries, {
    fields: [accountingEntryAttachments.workspaceSubdomain, accountingEntryAttachments.entryId],
    references: [accountingEntries.workspaceSubdomain, accountingEntries.id],
  }),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [questions.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  categories: many(questionCategories),
  options: many(questionOptions),
  tags: many(questionTags),
  citations: many(questionCitations),
  testQuestions: many(testQuestions),
  testSectionQuestions: many(testSectionQuestions),
  assessmentAnswers: many(assessmentAnswers),
}));

export const questionCategoriesRelations = relations(questionCategories, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [questionCategories.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  question: one(questions, {
    fields: [questionCategories.workspaceSubdomain, questionCategories.questionId],
    references: [questions.workspaceSubdomain, questions.id],
  }),
}));

export const questionOptionsRelations = relations(questionOptions, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [questionOptions.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  question: one(questions, {
    fields: [questionOptions.workspaceSubdomain, questionOptions.questionId],
    references: [questions.workspaceSubdomain, questions.id],
  }),
}));

export const questionTagsRelations = relations(questionTags, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [questionTags.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  question: one(questions, {
    fields: [questionTags.workspaceSubdomain, questionTags.questionId],
    references: [questions.workspaceSubdomain, questions.id],
  }),
}));

export const questionCitationsRelations = relations(questionCitations, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [questionCitations.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  question: one(questions, {
    fields: [questionCitations.workspaceSubdomain, questionCitations.questionId],
    references: [questions.workspaceSubdomain, questions.id],
  }),
}));

export const testsRelations = relations(tests, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [tests.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  questions: many(testQuestions),
  sections: many(testSections),
  results: many(assessmentResults),
}));

export const testQuestionsRelations = relations(testQuestions, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [testQuestions.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  test: one(tests, {
    fields: [testQuestions.workspaceSubdomain, testQuestions.testId],
    references: [tests.workspaceSubdomain, tests.id],
  }),
  question: one(questions, {
    fields: [testQuestions.workspaceSubdomain, testQuestions.questionId],
    references: [questions.workspaceSubdomain, questions.id],
  }),
}));

export const testSectionsRelations = relations(testSections, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [testSections.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  test: one(tests, {
    fields: [testSections.workspaceSubdomain, testSections.testId],
    references: [tests.workspaceSubdomain, tests.id],
  }),
  sectionQuestions: many(testSectionQuestions),
}));

export const testSectionQuestionsRelations = relations(testSectionQuestions, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [testSectionQuestions.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  section: one(testSections, {
    fields: [testSectionQuestions.workspaceSubdomain, testSectionQuestions.sectionId],
    references: [testSections.workspaceSubdomain, testSections.id],
  }),
  question: one(questions, {
    fields: [testSectionQuestions.workspaceSubdomain, testSectionQuestions.questionId],
    references: [questions.workspaceSubdomain, questions.id],
  }),
}));

export const assessmentResultsRelations = relations(assessmentResults, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [assessmentResults.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  test: one(tests, {
    fields: [assessmentResults.workspaceSubdomain, assessmentResults.testId],
    references: [tests.workspaceSubdomain, tests.id],
  }),
  answers: many(assessmentAnswers),
}));

export const assessmentAnswersRelations = relations(assessmentAnswers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [assessmentAnswers.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  result: one(assessmentResults, {
    fields: [assessmentAnswers.workspaceSubdomain, assessmentAnswers.resultId],
    references: [assessmentResults.workspaceSubdomain, assessmentResults.id],
  }),
  question: one(questions, {
    fields: [assessmentAnswers.workspaceSubdomain, assessmentAnswers.questionId],
    references: [questions.workspaceSubdomain, questions.id],
  }),
}));

export const obligationTypesRelations = relations(obligationTypes, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [obligationTypes.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  wakalaTypes: many(wakalaTypes),
  collections: many(obligationCollections),
}));

export const mujtahidsRelations = relations(mujtahids, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [mujtahids.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  reps: many(mujtahidReps),
}));

export const mujtahidRepsRelations = relations(mujtahidReps, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [mujtahidReps.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  mujtahid: one(mujtahids, {
    fields: [mujtahidReps.workspaceSubdomain, mujtahidReps.mujtahidId],
    references: [mujtahids.workspaceSubdomain, mujtahids.id],
  }),
  wakalaTypes: many(wakalaTypes),
  collections: many(obligationCollections),
}));

export const wakalaTypesRelations = relations(wakalaTypes, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [wakalaTypes.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  rep: one(mujtahidReps, {
    fields: [wakalaTypes.workspaceSubdomain, wakalaTypes.mujtahidRepresentativeId],
    references: [mujtahidReps.workspaceSubdomain, mujtahidReps.id],
  }),
  obligationType: one(obligationTypes, {
    fields: [wakalaTypes.workspaceSubdomain, wakalaTypes.obligationTypeId],
    references: [obligationTypes.workspaceSubdomain, obligationTypes.id],
  }),
  distributions: many(obligationDistributions),
}));

export const obligationDistributionsRelations = relations(obligationDistributions, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [obligationDistributions.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  wakalaType: one(wakalaTypes, {
    fields: [obligationDistributions.workspaceSubdomain, obligationDistributions.wakalaTypeId],
    references: [wakalaTypes.workspaceSubdomain, wakalaTypes.id],
  }),
}));

export const obligationCollectionsRelations = relations(obligationCollections, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [obligationCollections.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  obligationType: one(obligationTypes, {
    fields: [obligationCollections.workspaceSubdomain, obligationCollections.obligationTypeId],
    references: [obligationTypes.workspaceSubdomain, obligationTypes.id],
  }),
  rep: one(mujtahidReps, {
    fields: [obligationCollections.workspaceSubdomain, obligationCollections.mujtahidRepresentativeId],
    references: [mujtahidReps.workspaceSubdomain, mujtahidReps.id],
  }),
}));

export const userActivityLogsRelations = relations(userActivityLogs, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [userActivityLogs.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
}));

export const auditLogEntriesRelations = relations(auditLogEntries, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [auditLogEntries.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [contacts.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  phones: many(contactPhones),
  emails: many(contactEmails),
  addresses: many(contactAddresses),
  tags: many(contactTags),
  socials: many(contactSocials),
  educations: many(contactEducations),
  experiences: many(contactExperiences),
  skills: many(contactSkills),
  relationships: many(contactRelationships),
  activities: many(contactActivities),
  attachments: many(contactAttachments),
  students: many(students),
  teachers: many(teachers),
  tenantUsers: many(tenantUsers),
  messageLogs: many(messageLogs),
}));

export const contactPhonesRelations = relations(contactPhones, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactPhones.workspaceSubdomain, contactPhones.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
}));

export const contactEmailsRelations = relations(contactEmails, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactEmails.workspaceSubdomain, contactEmails.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
}));

export const contactAddressesRelations = relations(contactAddresses, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactAddresses.workspaceSubdomain, contactAddresses.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
}));

export const contactTagsRelations = relations(contactTags, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactTags.workspaceSubdomain, contactTags.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
}));

export const contactSocialsRelations = relations(contactSocials, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactSocials.workspaceSubdomain, contactSocials.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
}));

export const contactEducationsRelations = relations(contactEducations, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactEducations.workspaceSubdomain, contactEducations.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
}));

export const contactExperiencesRelations = relations(contactExperiences, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactExperiences.workspaceSubdomain, contactExperiences.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
}));

export const contactSkillsRelations = relations(contactSkills, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactSkills.workspaceSubdomain, contactSkills.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
}));

export const contactRelationshipsRelations = relations(contactRelationships, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactRelationships.workspaceSubdomain, contactRelationships.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
}));

export const contactActivitiesRelations = relations(contactActivities, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactActivities.workspaceSubdomain, contactActivities.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
}));

export const contactAttachmentsRelations = relations(contactAttachments, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactAttachments.workspaceSubdomain, contactAttachments.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
}));

export const tenantUsersRelations = relations(tenantUsers, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [tenantUsers.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  contact: one(contacts, {
    fields: [tenantUsers.workspaceSubdomain, tenantUsers.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
  teachers: many(teachers),
  backgroundJobs: many(backgroundJobs),
  userActivityLogs: many(userActivityLogs),
  auditLogEntries: many(auditLogEntries),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [students.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  contact: one(contacts, {
    fields: [students.workspaceSubdomain, students.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
  fatherContact: one(contacts, {
    fields: [students.workspaceSubdomain, students.fatherContactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
  motherContact: one(contacts, {
    fields: [students.workspaceSubdomain, students.motherContactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
  guardianContact: one(contacts, {
    fields: [students.workspaceSubdomain, students.guardianContactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
  enrolledSessions: many(studentEnrolledSessions),
  attendance: many(attendance),
  attendanceLeaves: many(attendanceLeaves),
  enrollments: many(enrollments),
  invoices: many(financeInvoices),
  examResults: many(examResults),
  hasanatDistributions: many(hasanatDistributions),
}));

export const studentEnrolledSessionsRelations = relations(studentEnrolledSessions, ({ one }) => ({
  student: one(students, {
    fields: [studentEnrolledSessions.workspaceSubdomain, studentEnrolledSessions.studentId],
    references: [students.workspaceSubdomain, students.id],
  }),
}));

export const teachersRelations = relations(teachers, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [teachers.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  contact: one(contacts, {
    fields: [teachers.workspaceSubdomain, teachers.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
  user: one(tenantUsers, {
    fields: [teachers.workspaceSubdomain, teachers.userId],
    references: [tenantUsers.workspaceSubdomain, tenantUsers.id],
  }),
  hasanatDistributions: many(hasanatDistributions),
}));

export const backgroundJobsRelations = relations(backgroundJobs, ({ one }) => ({
  user: one(tenantUsers, {
    fields: [backgroundJobs.tenantId, backgroundJobs.userId],
    references: [tenantUsers.workspaceSubdomain, tenantUsers.id],
  }),
}));

export const savedReportsRelations = relations(savedReports, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [savedReports.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
}));

export const platformActivityLogsRelations = relations(platformActivityLogs, ({ one }) => ({
  user: one(platformUsers, {
    fields: [platformActivityLogs.userId],
    references: [platformUsers.id],
  }),
}));

export const messageTemplatesRelations = relations(messageTemplates, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [messageTemplates.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
}));

export const messageLogsRelations = relations(messageLogs, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [messageLogs.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  contact: one(contacts, {
    fields: [messageLogs.workspaceSubdomain, messageLogs.contactId],
    references: [contacts.workspaceSubdomain, contacts.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [sessions.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
  classes: many(sessionClasses),
  timetable: many(sessionTimetable),
  discounts: many(sessionDiscounts),
  budgetExpenses: many(sessionBudgetExpenses),
  budgetIncomes: many(sessionBudgetIncomes),
  events: many(sessionEvents),
  tabarruk: many(sessionTabarruk),
  enrollments: many(enrollments),
}));

export const sessionClassesRelations = relations(sessionClasses, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionClasses.workspaceSubdomain, sessionClasses.sessionId],
    references: [sessions.workspaceSubdomain, sessions.id],
  }),
}));

export const sessionTimetableRelations = relations(sessionTimetable, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionTimetable.workspaceSubdomain, sessionTimetable.sessionId],
    references: [sessions.workspaceSubdomain, sessions.id],
  }),
}));

export const sessionDiscountsRelations = relations(sessionDiscounts, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionDiscounts.workspaceSubdomain, sessionDiscounts.sessionId],
    references: [sessions.workspaceSubdomain, sessions.id],
  }),
}));

export const sessionBudgetExpensesRelations = relations(sessionBudgetExpenses, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionBudgetExpenses.workspaceSubdomain, sessionBudgetExpenses.sessionId],
    references: [sessions.workspaceSubdomain, sessions.id],
  }),
}));

export const sessionBudgetIncomesRelations = relations(sessionBudgetIncomes, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionBudgetIncomes.workspaceSubdomain, sessionBudgetIncomes.sessionId],
    references: [sessions.workspaceSubdomain, sessions.id],
  }),
}));

export const sessionEventsRelations = relations(sessionEvents, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionEvents.workspaceSubdomain, sessionEvents.sessionId],
    references: [sessions.workspaceSubdomain, sessions.id],
  }),
}));

export const sessionTabarrukRelations = relations(sessionTabarruk, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionTabarruk.workspaceSubdomain, sessionTabarruk.sessionId],
    references: [sessions.workspaceSubdomain, sessions.id],
  }),
}));

export const dashboardPreferencesRelations = relations(dashboardPreferences, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [dashboardPreferences.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
}));

export const dashboardWidgetsRelations = relations(dashboardWidgets, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [dashboardWidgets.workspaceSubdomain],
    references: [workspaces.subdomain],
  }),
}));

