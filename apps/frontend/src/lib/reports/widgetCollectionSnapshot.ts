import { readQueryCollection } from "@/lib/queryCacheCollections";
import { ATTENDANCE_QUERY_KEY } from "@/tenant/hooks/collections/attendance";
import { FINANCE_INVOICES_QUERY_KEY } from "@/tenant/hooks/collections/finance";
import {
  HASANAT_DENOMS_QUERY_KEY,
  HASANAT_DISTRIBUTIONS_QUERY_KEY,
} from "@/tenant/hooks/collections/hasanat";
import {
  QUESTION_BANK_QUESTIONS_QUERY_KEY,
  QUESTION_BANK_RESULTS_QUERY_KEY,
  QUESTION_BANK_TESTS_QUERY_KEY,
} from "@/tenant/hooks/collections/questionBank";
import type { CustomWidget } from "./pinnedWidgetTypes";
import type { ReportCollectionsSnapshot } from "@/lib/reports/useReportCollections";
import type { Denomination, Distribution } from "@/lib/data/hasanatData";
import type { Student } from "@/lib/data/studentsData";
import type { Teacher } from "@/lib/data/teachersData";
import type { Session } from "@/lib/data/sessionsData";
import type { Invoice } from "@/lib/data/financeData";
import type { AttendanceRecord } from "@/lib/data/attendanceData";
import type {
  Contact,
  QuestionBankQuestion,
  QuestionBankTest,
  QuestionBankResult,
} from "@mms/shared";
import { matchesWidgetFilter } from "@mms/shared";

export function getWidgetCollections(): ReportCollectionsSnapshot {
  // Contacts + students + teachers + sessions: SQL aggregates / empty dump — do not invent localStorage rows.
  const contacts: Contact[] = [];
  const students: Student[] = [];
  const teachers: Teacher[] = [];
  const sessions: Session[] = [];
  const invoices = readQueryCollection<Invoice>(FINANCE_INVOICES_QUERY_KEY) ?? [];
  const attendance = readQueryCollection<AttendanceRecord>(ATTENDANCE_QUERY_KEY) ?? [];
  const distributions = readQueryCollection<Distribution>(HASANAT_DISTRIBUTIONS_QUERY_KEY) ?? [];
  const denominations = readQueryCollection<Denomination>(HASANAT_DENOMS_QUERY_KEY) ?? [];
  const questions = readQueryCollection<QuestionBankQuestion>(QUESTION_BANK_QUESTIONS_QUERY_KEY) ?? [];
  const tests = readQueryCollection<QuestionBankTest>(QUESTION_BANK_TESTS_QUERY_KEY) ?? [];
  const assessmentResults =
    readQueryCollection<QuestionBankResult>(QUESTION_BANK_RESULTS_QUERY_KEY) ?? [];

  return {
    students,
    teachers,
    sessions,
    finance_invoices: invoices,
    attendance_records: attendance,
    hasanat_distributions: distributions,
    hasanat_denoms: denominations,
    contacts,
    questions,
    tests,
    assessment_results: assessmentResults,
  };
}

/**
 * Filters a collection in real-time based on widget query conditions.
 */
export function getFilteredRecords(
  widget: CustomWidget,
  collections: ReportCollectionsSnapshot,
): Record<string, unknown>[] {
  const collectionRecords = (collections[widget.collection] || []) as Record<string, unknown>[];
  return collectionRecords.filter((collectionRecord) =>
    matchesWidgetFilter(
      collectionRecord,
      widget.filterField,
      widget.filterOperator,
      widget.filterValue,
    )
  );
}
