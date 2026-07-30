import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContactsPaginated } from '@/tenant/hooks/collections/contacts';
import { useStudentsPaginated } from '@/tenant/hooks/collections/students';
import { useSessionsCollection } from '@/tenant/hooks/collections/sessions';
import { useFinanceInvoicesCollection } from "@/tenant/hooks/collections/finance";
import { useAttendanceRecordsCollection } from "@/tenant/hooks/collections/attendance";
import { useHasanatDistributionsCollection } from "@/tenant/hooks/collections/hasanat";
import { useExaminationsResultsCollection } from "@/tenant/hooks/collections/examinations";
import { useTranslation } from "@/hooks/useTranslation";
import { usePermissions } from "@/tenant/hooks/usePermissions";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import {
  CONTACTS_MODULE_MANIFEST,
  STUDENTS_MODULE_MANIFEST,
} from "@mms/shared";
import { CustomReportBuilderConfigPanel } from "./CustomReportBuilderConfigPanel";
import { CustomReportBuilderPreviewPanel } from "./CustomReportBuilderPreviewPanel";
import {
  buildContactsCustomReportFieldCatalog,
  buildCustomReportFieldCatalog,
  getInitialDataSource,
  getInitialSelectedFields,
  resolveCustomReportFieldLabel,
  type AggregateFn,
  type DataSource,
  type PreviewRow,
} from "./customReportBuilderFields";
import { buildCustomReportPreviewRows } from "./customReportBuilderPreview";

/** Props for the CustomReportBuilder component. */
interface CustomReportBuilderProps {
  /** Callback invoked when the user closes the builder panel. */
  onClose: () => void;
  /** Optional initial data source to select. */
  initialSource?: string;
}

/**
 * An interactive custom report builder that lets users choose a data source,
 * pick and reorder columns, select aggregation functions, and preview a
 * generated report before exporting.
 *
 * @param props - The component props.
 * @returns The CustomReportBuilder component.
 */
export default function CustomReportBuilder({ onClose, initialSource }: CustomReportBuilderProps): React.JSX.Element {
  const { t } = useTranslation();
  const { role: viewerRole } = usePermissions();
  const { fieldConfig } = useContactConfig();
  const { activeCurrency } = useFinanceCurrency();

  const [source, setSource] = useState<DataSource>(() => getInitialDataSource(initialSource));

  const { data: contactsPreviewPage } = useContactsPaginated({
    page: 1,
    limit: CONTACTS_MODULE_MANIFEST.defaultPageSize,
    enabled: source === "contacts",
  });
  const { data: studentsPreviewPage } = useStudentsPaginated({
    page: 1,
    limit: STUDENTS_MODULE_MANIFEST.defaultPageSize,
    enabled: source === "students",
  });
  const contactsColl = useMemo(() => (contactsPreviewPage?.contacts ?? []) as unknown as Record<string, unknown>[], [contactsPreviewPage?.contacts]);
  const studentsColl = useMemo(() => (studentsPreviewPage?.students ?? []) as unknown as Record<string, unknown>[], [studentsPreviewPage?.students]);
  const sessionsFromQuery = useSessionsCollection();
  const sessionsColl = sessionsFromQuery as unknown as Record<string, unknown>[];
  const financialColl = useFinanceInvoicesCollection() as unknown as Record<string, unknown>[];
  const attendanceColl = useAttendanceRecordsCollection() as unknown as Record<string, unknown>[];
  const hasanatColl = useHasanatDistributionsCollection() as unknown as Record<string, unknown>[];
  const academicColl = useExaminationsResultsCollection() as unknown as Record<string, unknown>[];

  const [selectedFields, setSelectedFields] = useState<string[]>(() => getInitialSelectedFields(initialSource));

  const [aggregate, setAggregate]         = useState<AggregateFn>("None");
  const [groupBy, setGroupBy]             = useState<string>("");
  const [orientation, setOrientation]     = useState<"p" | "l">("p");
  const [pageSize, setPageSize]           = useState<string>("a4");
  const [reportName, setReportName]       = useState<string>(() => t("reports.builder.defaultName"));
  const [previewData, setPreviewData]     = useState<PreviewRow[]>([]);

  const resolveFieldLabel = useCallback((field: string): string => {
    return resolveCustomReportFieldLabel(source, field, fieldConfig.fields, (key) => t(key));
  }, [source, fieldConfig.fields, t]);

  const contactsFieldCatalog = useMemo(() => {
    if (source !== "contacts") return [];
    return buildContactsCustomReportFieldCatalog(
      fieldConfig.fields,
      fieldConfig.formTabs ?? [],
      viewerRole,
    );
  }, [source, fieldConfig.fields, fieldConfig.formTabs, viewerRole]);

  const available = useMemo(() => {
    return buildCustomReportFieldCatalog(source, selectedFields, contactsFieldCatalog);
  }, [source, selectedFields, contactsFieldCatalog]);

  // Sync group-by selection to make sure it's valid if columns change
  useEffect(() => {
    if (groupBy && !selectedFields.includes(groupBy)) {
      setGroupBy("");
    }
  }, [selectedFields, groupBy]);

  // Auto-generate preview rows reactively on configurations edit
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
  }, [source, selectedFields, aggregate, groupBy, contactsColl, studentsColl, sessionsColl, financialColl, attendanceColl, hasanatColl, academicColl, t, resolveFieldLabel, activeCurrency.code]);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="rounded-3xl border border-border/50 bg-card/45 backdrop-blur-2xl shadow-2xl overflow-hidden text-start"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 border-b border-border/50 bg-card/30">
        <div className="flex min-w-0 items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
            <Sliders className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-black text-foreground uppercase tracking-wider leading-none">{t("reports.builder.title")}</h3>
            <p className="text-xs text-muted-foreground mt-1 uppercase font-bold tracking-wider">{t("reports.builder.subtitle")}</p>
          </div>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          type="button"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CustomReportBuilderConfigPanel
          reportName={reportName}
          setReportName={setReportName}
          source={source}
          setSource={setSource}
          selectedFields={selectedFields}
          setSelectedFields={setSelectedFields}
          availableFields={available}
          addField={addField}
          aggregate={aggregate}
          setAggregate={setAggregate}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          orientation={orientation}
          setOrientation={setOrientation}
          pageSize={pageSize}
          setPageSize={setPageSize}
          resolveFieldLabel={resolveFieldLabel}
        />
        <CustomReportBuilderPreviewPanel
          selectedFields={selectedFields}
          setSelectedFields={setSelectedFields}
          previewData={previewData}
          aggregate={aggregate}
          groupBy={groupBy}
          reportName={reportName}
          orientation={orientation}
          pageSize={pageSize}
          removeField={removeField}
          moveUp={moveUp}
          moveDown={moveDown}
          resolveFieldLabel={resolveFieldLabel}
        />
      </div>

    </motion.div>
  );
}
