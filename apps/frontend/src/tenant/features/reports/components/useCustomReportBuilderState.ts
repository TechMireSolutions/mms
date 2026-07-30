import { useState, useEffect, useMemo, useCallback } from 'react';
import { useContactsPaginated } from '@/tenant/hooks/collections/contacts';
import { useStudentsPaginated } from '@/tenant/hooks/collections/students';
import { useSessionsCollection } from '@/tenant/hooks/collections/sessions';
import { useFinanceInvoicesCollection } from '@/tenant/hooks/collections/finance';
import { useAttendanceRecordsCollection } from '@/tenant/hooks/collections/attendance';
import { useHasanatDistributionsCollection } from '@/tenant/hooks/collections/hasanat';
import { useExaminationsResultsCollection } from '@/tenant/hooks/collections/examinations';
import { useTranslation } from '@/hooks/useTranslation';
import { usePermissions } from '@/tenant/hooks/usePermissions';
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
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
  const { fieldConfig } = useContactConfig();
  const { activeCurrency } = useFinanceCurrency();

  const [source, setSource] = useState<DataSource>(() => getInitialDataSource(initialSource));
  const [selectedFields, setSelectedFields] = useState<string[]>(() => getInitialSelectedFields(initialSource));
  const [aggregate, setAggregate] = useState<AggregateFn>('None');
  const [groupBy, setGroupBy] = useState<string>('');
  const [orientation, setOrientation] = useState<'p' | 'l'>('p');
  const [pageSize, setPageSize] = useState<string>('a4');
  const [reportName, setReportName] = useState<string>(() => t('reports.builder.defaultName'));
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);

  const { data: contactsPreviewPage } = useContactsPaginated({
    page: 1,
    limit: CONTACTS_MODULE_MANIFEST.defaultPageSize,
    enabled: source === 'contacts',
  });
  const { data: studentsPreviewPage } = useStudentsPaginated({
    page: 1,
    limit: STUDENTS_MODULE_MANIFEST.defaultPageSize,
    enabled: source === 'students',
  });
  const contactsColl = useMemo(
    () => (contactsPreviewPage?.contacts ?? []) as unknown as Record<string, unknown>[],
    [contactsPreviewPage?.contacts],
  );
  const studentsColl = useMemo(
    () => (studentsPreviewPage?.students ?? []) as unknown as Record<string, unknown>[],
    [studentsPreviewPage?.students],
  );
  const sessionsColl = useSessionsCollection() as unknown as Record<string, unknown>[];
  const financialColl = useFinanceInvoicesCollection() as unknown as Record<string, unknown>[];
  const attendanceColl = useAttendanceRecordsCollection() as unknown as Record<string, unknown>[];
  const hasanatColl = useHasanatDistributionsCollection() as unknown as Record<string, unknown>[];
  const academicColl = useExaminationsResultsCollection() as unknown as Record<string, unknown>[];

  const resolveFieldLabel = useCallback(
    (field: string): string => resolveCustomReportFieldLabel(source, field, fieldConfig.fields, (key) => t(key)),
    [source, fieldConfig.fields, t],
  );

  const contactsFieldCatalog = useMemo(() => {
    if (source !== 'contacts') return [];
    return buildContactsCustomReportFieldCatalog(
      fieldConfig.fields,
      fieldConfig.formTabs ?? [],
      viewerRole,
    );
  }, [source, fieldConfig.fields, fieldConfig.formTabs, viewerRole]);

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
