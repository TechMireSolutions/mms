import { useState, useEffect, useMemo, useCallback } from 'react';
import { useContactsContractList } from '@/tenant/hooks/collections/contacts';
import { useStudentsContractList } from '@/tenant/hooks/collections/students';
import { useSessionsCollection } from '@/tenant/hooks/collections/sessions';
import { useFinanceInvoicesPaginated } from '@/tenant/hooks/collections/finance';
import { useAttendanceRecordsCollection } from '@/tenant/hooks/collections/attendance';
import { useHasanatDistributionsCollection } from '@/tenant/hooks/collections/hasanat';
import { useExaminationsResultsCollection } from '@/tenant/hooks/collections/examinations';
import { useTranslation } from '@/hooks/useTranslation';
import { usePermissions } from '@/tenant/hooks/usePermissions';
import { useFinanceCurrency } from '@/hooks/useCurrency';
import {
  CONTACTS_MODULE_MANIFEST,
  STUDENTS_MODULE_MANIFEST,
} from '@mms/shared';
import {
  buildContactsCustomReportFieldCatalog,
  buildCustomReportFieldCatalog,
  getInitialDataSource,
  getInitialSelectedFields,
  resolveCustomReportFieldLabel,
  type AggregateFn,
  type DataSource,
  type PreviewRow,
} from './customReportBuilderFields';
import { buildCustomReportPreviewRows } from './customReportBuilderPreview';

export function useCustomReportBuilderState(initialSource?: string) {
  const { t } = useTranslation();
  const { role: viewerRole } = usePermissions();
    const { activeCurrency } = useFinanceCurrency();

  const [source, setSource] = useState<DataSource>(() => getInitialDataSource(initialSource));
  const [selectedFields, setSelectedFields] = useState<string[]>(() => getInitialSelectedFields(initialSource));
  const [aggregate, setAggregate] = useState<AggregateFn>('None');
  const [groupBy, setGroupBy] = useState<string>('');
  const [orientation, setOrientation] = useState<'p' | 'l'>('p');
  const [pageSize, setPageSize] = useState<string>('a4');
  const [reportName, setReportName] = useState<string>(() => t('reports.builder.defaultName'));
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);

  const { data: contactsPreviewPage } = useContactsContractList({
    page: 1,
    limit: CONTACTS_MODULE_MANIFEST.defaultPageSize,
  }, source === 'contacts');
  const { data: studentsPreviewPage } = useStudentsContractList({
    page: 1,
    limit: STUDENTS_MODULE_MANIFEST.defaultPageSize,
  }, source === 'students');
  const contactsColl = useMemo(
    () => (contactsPreviewPage?.body?.contacts ?? []) as unknown as Record<string, unknown>[],
    [contactsPreviewPage?.body?.contacts],
  );
  const studentsColl = useMemo(
    () => (studentsPreviewPage?.body?.students ?? []) as unknown as Record<string, unknown>[],
    [studentsPreviewPage?.body?.students],
  );
  const sessionsData = useSessionsCollection({ enabled: source === 'sessions' });
  const sessionsColl = useMemo(() => (sessionsData ?? []) as unknown as Record<string, unknown>[], [sessionsData]);

  const financialResult = useFinanceInvoicesPaginated({ page: 1, limit: 50 }, { enabled: source === 'financial' });
  const financialData = financialResult.data?.invoices;
  const financialColl = useMemo(() => (financialData ?? []) as unknown as Record<string, unknown>[], [financialData]);

  const attendanceData = useAttendanceRecordsCollection({ enabled: source === 'attendance' });
  const attendanceColl = useMemo(() => (attendanceData ?? []) as unknown as Record<string, unknown>[], [attendanceData]);

  const hasanatData = useHasanatDistributionsCollection({ enabled: source === 'hasanat' });
  const hasanatColl = useMemo(() => (hasanatData ?? []) as unknown as Record<string, unknown>[], [hasanatData]);

  const academicData = useExaminationsResultsCollection({ enabled: source === 'academic' });
  const academicColl = useMemo(() => (academicData ?? []) as unknown as Record<string, unknown>[], [academicData]);

  const resolveFieldLabel = useCallback(
    (field: string): string => resolveCustomReportFieldLabel(source, field, {}, (key) => t(key)),
    [source, t],
  );

  const contactsFieldCatalog = useMemo(() => {
    if (source !== 'contacts') return [];
    return buildContactsCustomReportFieldCatalog(
      {},
      [],
      viewerRole,
    );
  }, [source, viewerRole]);

  const available = useMemo(
    () => buildCustomReportFieldCatalog(source, selectedFields, contactsFieldCatalog),
    [source, selectedFields, contactsFieldCatalog],
  );

  useEffect(() => {
    if (groupBy && !selectedFields.includes(groupBy)) {
      setGroupBy('');
    }
  }, [selectedFields, groupBy]);

  useEffect(() => {
    if (selectedFields.length === 0) {
      setPreviewData([]);
      return;
    }

    setPreviewData(buildCustomReportPreviewRows({
      source,
      selectedFields,
      aggregate,
      groupBy,
      collections: {
        contacts: contactsColl,
        students: studentsColl,
        sessions: sessionsColl,
        financial: financialColl,
        attendance: attendanceColl,
        hasanat: hasanatColl,
        academic: academicColl,
      },
      currencyCode: activeCurrency.code,
      translate: (key) => t(key),
      resolveFieldLabel,
    }));
  }, [
    source,
    selectedFields,
    aggregate,
    groupBy,
    contactsColl,
    studentsColl,
    sessionsColl,
    financialColl,
    attendanceColl,
    hasanatColl,
    academicColl,
    t,
    resolveFieldLabel,
    activeCurrency.code,
  ]);

  const addField = (field: string): void => {
    setSelectedFields((currentFields) => [...currentFields, field]);
  };

  const removeField = (field: string): void => {
    setSelectedFields((currentFields) => currentFields.filter((candidate) => candidate !== field));
  };

  const moveUp = (index: number): void => {
    setSelectedFields((currentFields) => {
      const nextFields = [...currentFields];
      [nextFields[index - 1], nextFields[index]] = [nextFields[index], nextFields[index - 1]];
      return nextFields;
    });
  };

  const moveDown = (index: number): void => {
    setSelectedFields((currentFields) => {
      const nextFields = [...currentFields];
      [nextFields[index + 1], nextFields[index]] = [nextFields[index], nextFields[index + 1]];
      return nextFields;
    });
  };

  return {
    reportName,
    setReportName,
    source,
    setSource,
    selectedFields,
    setSelectedFields,
    aggregate,
    setAggregate,
    groupBy,
    setGroupBy,
    orientation,
    setOrientation,
    pageSize,
    setPageSize,
    previewData,
    available,
    resolveFieldLabel,
    addField,
    removeField,
    moveUp,
    moveDown,
  };
}
