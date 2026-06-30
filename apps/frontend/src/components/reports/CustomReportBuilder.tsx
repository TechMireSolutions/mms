import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, GripVertical, Plus, Check, Trash2, FileSpreadsheet, FileText, Settings, Database, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { useContactsPaginated } from '@/hooks/useContacts';
import { useStudentsPaginated } from '@/hooks/useStudents';
import { CONTACTS_MODULE_CONTRACT, STUDENTS_MODULE_CONTRACT } from '@mms/shared';
import { useSessionsCollection } from '@/hooks/useSessions';
import { useFinanceInvoicesCollection } from "@/hooks/useFinanceApi";
import { useAttendanceRecordsCollection } from "@/hooks/useAttendance";
import { useHasanatDistributionsCollection } from "@/hooks/useHasanatApi";
import { useExaminationsResultsCollection } from "@/hooks/useExaminationsApi";
import { useTranslation } from "@/hooks/useTranslation";
import { usePermissions } from "@/hooks/usePermissions";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import type { AppTranslationKey } from "@mms/shared";
import {
  buildContactsReportFieldCatalog,
  getContactReportCellValue,
  isContactsReportFieldId,
  resolveContactReportFieldLabel,
  type ContactsReportFieldId,
} from "@mms/shared";

/** Data source keys available in the custom report builder. */
type DataSource = "students" | "contacts" | "attendance" | "financial" | "academic" | "hasanat" | "sessions" | "faculty";

/** Map of all selectable fields grouped by data source (non-contacts legacy labels). */
const ALL_FIELDS: Record<Exclude<DataSource, "contacts">, readonly string[]> = {
  students:   ["Name", "Gender", "Class", "Session", "City", "Age", "Status", "Registration Date", "CNIC", "Discount Type", "Discount %", "Roll No", "Blood Group"],
  attendance: ["Student Name", "Class", "Status", "Present", "Absent", "Late", "Excused", "Total Days", "Rate %", "Last Marked"],
  financial:  ["Invoice ID", "Student Name", "Class", "Base Fee", "Discount", "Tax", "Final Amount", "Status", "Due Date", "Payment Method", "Issued Date"],
  academic:   ["Student Name", "Class", "Subject", "Marks", "Total", "Grade", "Rank", "Exam Name", "Date"],
  hasanat:    ["Student Name", "Class", "Faculty", "Distributed", "Redeemed", "Balance", "Reason", "Last Awarded"],
  sessions:   ["Session", "Class", "Type", "Teacher", "Room", "Time", "Days", "Enrolled", "Capacity", "Utilisation %", "Status", "Start Date", "End Date"],
  faculty:    ["Faculty Name", "Classes", "Sessions", "Total Students", "Hours/Week", "Specialization"],
};

/** Map of legacy selectable fields to translation keys. */
const FIELD_KEY_MAP: Record<string, string> = {
  "Name": "reports.fields.name",
  "Gender": "reports.fields.gender",
  "Class": "reports.fields.className",
  "Session": "reports.fields.sessionName",
  "City": "reports.fields.city",
  "Age": "reports.fields.age",
  "Status": "reports.fields.status",
  "Registration Date": "reports.fields.registeredDate",
  "CNIC": "reports.fields.cnic",
  "Discount Type": "reports.fields.discountType",
  "Discount %": "reports.fields.discountPct",
  "Roll No": "reports.fields.rollNo",
  "Blood Group": "reports.fields.bloodGroup",
  "Student Name": "reports.fields.studentName",
  "Present": "reports.fields.present",
  "Absent": "reports.fields.absent",
  "Late": "reports.fields.late",
  "Excused": "reports.fields.excused",
  "Total Days": "reports.fields.totalDays",
  "Rate %": "reports.fields.rate",
  "Last Marked": "reports.fields.lastMarked",
  "Invoice ID": "reports.fields.invoiceId",
  "Base Fee": "reports.fields.baseFee",
  "Discount": "reports.fields.discountAmt",
  "Tax": "reports.fields.tax",
  "Final Amount": "reports.fields.finalAmt",
  "Due Date": "reports.fields.dueDate",
  "Payment Method": "reports.fields.paymentMethod",
  "Issued Date": "reports.fields.issuedDate",
  "Subject": "reports.fields.subject",
  "Marks": "reports.fields.marks",
  "Total": "reports.fields.total",
  "Grade": "reports.fields.grade",
  "Rank": "reports.fields.rank",
  "Exam Name": "reports.fields.examName",
  "Date": "reports.fields.date",
  "Faculty": "reports.fields.faculty",
  "Distributed": "reports.fields.distributed",
  "Redeemed": "reports.fields.redeemed",
  "Balance": "reports.fields.balance",
  "Reason": "reports.fields.reason",
  "Last Awarded": "reports.fields.lastAwarded",
  "Type": "reports.fields.type",
  "Teacher": "reports.fields.teacherName",
  "Room": "reports.fields.room",
  "Time": "reports.fields.time",
  "Days": "reports.fields.days",
  "Enrolled": "reports.fields.enrolled",
  "Capacity": "reports.fields.capacity",
  "Utilisation %": "reports.fields.utilisationPct",
  "Start Date": "reports.fields.startDate",
  "End Date": "reports.fields.endDate",
  "Faculty Name": "reports.fields.facultyName",
  "Classes": "reports.fields.classes",
  "Sessions": "reports.fields.sessions",
  "Total Students": "reports.fields.totalStudents",
  "Hours/Week": "reports.fields.hoursWeek",
  "Specialization": "reports.fields.specialization"
};

/** Available aggregate function options. */
const AGGREGATE_FNS: readonly string[] = ["None", "Sum", "Average", "Count", "Max", "Min"];

/** Mock preview row shape — values may be missing for unmapped fields. */
type PreviewRow = Record<string, string | number>;

/** Props for the internal DraggableField sub-component. */
interface DraggableFieldProps {
  /** The field name label. */
  field: string;
  /** Callback to remove this field from the selection. */
  onRemove: () => void;
  /** Callback to move this field one position earlier. */
  onMoveUp: () => void;
  /** Callback to move this field one position later. */
  onMoveDown: () => void;
  /** Whether this is the first field (disables move-up). */
  isFirst: boolean;
  /** Whether this is the last field (disables move-down). */
  isLast: boolean;
}

/**
 * Renders a single draggable/sortable field row within the selected-columns panel.
 *
 * @param props - The component props.
 * @returns The DraggableField component.
 */
function DraggableField({
  field,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: DraggableFieldProps): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl border border-border bg-card/60 backdrop-blur-md hover:bg-card/90 transition-colors group shadow-sm"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground cursor-grab active:cursor-grabbing shrink-0" />
        <span className="text-xs font-semibold text-foreground truncate">{field}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          disabled={isFirst}
          onClick={onMoveUp}
          variant="ghost"
          className="w-5 h-5 flex items-center justify-center p-0 rounded-lg hover:bg-muted disabled:opacity-20 text-[10px] text-muted-foreground font-black cursor-pointer transition-colors"
          type="button"
          title={t("reports.builder.moveUp")}
        >
          ▲
        </Button>
        <Button
          disabled={isLast}
          onClick={onMoveDown}
          variant="ghost"
          className="w-5 h-5 flex items-center justify-center p-0 rounded-lg hover:bg-muted disabled:opacity-20 text-[10px] text-muted-foreground font-black cursor-pointer transition-colors"
          type="button"
          title={t("reports.builder.moveDown")}
        >
          ▼
        </Button>
        <Button
          onClick={onRemove}
          variant="ghost"
          className="w-5 h-5 flex items-center justify-center p-0 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer transition-all"
          type="button"
          title={t("reports.builder.removeField")}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  );
}

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
  const { can, role: viewerRole } = usePermissions();
  const { fieldConfig } = useContactConfig();

  const [source, setSource] = useState<DataSource>(() => {
    if (initialSource === "financial") return "financial";
    if (initialSource === "attendance") return "attendance";
    if (initialSource === "academic") return "academic";
    if (initialSource === "hasanat") return "hasanat";
    if (initialSource === "sessions") return "sessions";
    if (initialSource === "faculty") return "faculty";
    if (initialSource === "contacts") return "contacts";
    return "students";
  });

  const { data: contactsPreviewPage } = useContactsPaginated({
    page: 1,
    limit: CONTACTS_MODULE_CONTRACT.defaultPageSize,
    enabled: source === "contacts",
  });
  const { data: studentsPreviewPage } = useStudentsPaginated({
    page: 1,
    limit: STUDENTS_MODULE_CONTRACT.defaultPageSize,
    enabled: source === "students",
  });
  const contactsColl = (contactsPreviewPage?.contacts ?? []) as unknown as Record<string, unknown>[];
  const studentsColl = (studentsPreviewPage?.students ?? []) as unknown as Record<string, unknown>[];
  const sessionsFromQuery = useSessionsCollection();
  const sessionsColl = sessionsFromQuery as unknown as Record<string, unknown>[];
  const financialColl = useFinanceInvoicesCollection() as unknown as Record<string, unknown>[];
  const attendanceColl = useAttendanceRecordsCollection() as unknown as Record<string, unknown>[];
  const hasanatColl = useHasanatDistributionsCollection() as unknown as Record<string, unknown>[];
  const academicColl = useExaminationsResultsCollection() as unknown as Record<string, unknown>[];

  const [selectedFields, setSelectedFields] = useState<string[]>(() => {
    if (initialSource === "contacts") return ["fullName", "lifecycleStage", "city"];
    if (initialSource === "financial") return ["Student Name", "Class", "Base Fee", "Discount", "Final Amount", "Status"];
    if (initialSource === "attendance") return ["Student Name", "Class", "Status", "Rate %"];
    if (initialSource === "academic") return ["Student Name", "Class", "Subject", "Marks", "Grade"];
    if (initialSource === "hasanat") return ["Student Name", "Class", "Faculty", "Distributed", "Balance"];
    if (initialSource === "sessions") return ["Session", "Class", "Teacher", "Enrolled", "Capacity"];
    if (initialSource === "faculty") return ["Faculty Name", "Classes", "Sessions", "Total Students", "Hours/Week"];
    return ["Name", "Class", "Session", "Status"];
  });

  const [aggregate, setAggregate]         = useState<string>("None");
  const [groupBy, setGroupBy]             = useState<string>("");
  const [orientation, setOrientation]     = useState<"p" | "l">("p");
  const [pageSize, setPageSize]           = useState<string>("a4");
  const [reportName, setReportName]       = useState<string>(() => t("reports.builder.defaultName"));
  const [previewData, setPreviewData]     = useState<PreviewRow[]>([]);

  const resolveFieldLabel = (field: string): string => {
    if (source === "contacts") {
      return resolveContactReportFieldLabel(field, fieldConfig.fields, (key) => t(key as AppTranslationKey));
    }
    const fieldTranslationKey = FIELD_KEY_MAP[field];
    if (fieldTranslationKey) {
      return t(fieldTranslationKey as AppTranslationKey);
    }
    return field;
  };

  const contactsFieldCatalog = useMemo(() => {
    if (source !== "contacts" || !viewerRole) return [];
    return buildContactsReportFieldCatalog(
      fieldConfig.fields,
      fieldConfig.formTabs ?? [],
      viewerRole,
    );
  }, [source, fieldConfig.fields, fieldConfig.formTabs, viewerRole]);

  const available = useMemo(() => {
    if (source === "contacts") {
      return contactsFieldCatalog.map((contactField) => contactField.id).filter((fieldId) => !selectedFields.includes(fieldId));
    }
    return ALL_FIELDS[source].filter((fieldName) => !selectedFields.includes(fieldName));
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

    let sourceRows: Record<string, unknown>[] = [];
    if (source === "contacts") {
      sourceRows = contactsColl;
    } else if (source === "students") {
      sourceRows = studentsColl;
    } else if (source === "sessions") {
      sourceRows = sessionsColl;
    } else if (source === "financial") {
      sourceRows = financialColl;
    } else if (source === "attendance") {
      sourceRows = attendanceColl;
    } else if (source === "hasanat") {
      sourceRows = hasanatColl;
    } else if (source === "academic") {
      sourceRows = academicColl;
    } else if (source === "faculty") {
      const sessionsList = sessionsColl;
      const workloadByFacultyName: Record<string, { classes: Set<string>, sessions: Set<string>, students: number, hours: number }> = {};
      sessionsList.forEach((session) => {
        const classes = session.classes as { id: string; teacherName?: string; enrolled: number }[] | undefined;
        if (classes) {
          classes.forEach((sessionClass) => {
            const facultyName = sessionClass.teacherName || "Unassigned";
            if (!workloadByFacultyName[facultyName]) {
              workloadByFacultyName[facultyName] = { classes: new Set(), sessions: new Set(), students: 0, hours: 0 };
            }
            workloadByFacultyName[facultyName].classes.add(sessionClass.id);
            workloadByFacultyName[facultyName].sessions.add(String(session.id));
            workloadByFacultyName[facultyName].students += Number(sessionClass.enrolled || 0);
            workloadByFacultyName[facultyName].hours += 2; // Assuming 2 hours per class workload
          });
        }
      });
      sourceRows = Object.entries(workloadByFacultyName).map(([facultyName, workload]) => ({
        facultyName,
        classes: workload.classes.size,
        sessions: workload.sessions.size,
        totalStudents: workload.students,
        hoursWeek: workload.hours,
        specialization: "General Studies",
      }));
    }

    const toCamelCase = (value: string): string => {
      const cleaned = value.replace(/[^a-zA-Z0-9 ]/g, "");
      return cleaned
        .split(" ")
        .map((word, index) => index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join("");
    };

    let processedRows = sourceRows.map((sourceRow) => {
      const row: PreviewRow = {};
      const cellLabels = { yes: t("common.yes"), no: t("common.no") };
      selectedFields.forEach((selectedField) => {
        const label = resolveFieldLabel(selectedField);
        if (source === "contacts" && isContactsReportFieldId(selectedField)) {
          row[label] = getContactReportCellValue(sourceRow, selectedField as ContactsReportFieldId, cellLabels);
          return;
        }
        const camel = toCamelCase(selectedField);
        if (selectedField === "Name" || selectedField === "Student Name" || selectedField === "Faculty Name" || selectedField === "Faculty") {
          row[label] = String(sourceRow.name || sourceRow.studentName || sourceRow.facultyName || sourceRow.faculty || "—");
        }
        else if (selectedField === "Status") row[label] = String(sourceRow.status || "—");
        else if (selectedField === "Class") row[label] = String(sourceRow.class || sourceRow.className || (sourceRow.classes as { name: string }[] | undefined)?.[0]?.name || "—");
        else if (selectedField === "Session") row[label] = String(sourceRow.session || "—");
        else if (selectedField === "Teacher") row[label] = String(sourceRow.teacher || sourceRow.teacherName || "—");
        else if (selectedField === "Room") row[label] = String(sourceRow.room || "—");
        else if (selectedField === "Time") row[label] = String(sourceRow.time || "—");
        else if (selectedField === "Days") row[label] = Array.isArray(sourceRow.days) ? sourceRow.days.join(", ") : String(sourceRow.days || "—");
        else if (selectedField === "Discount Type") row[label] = String(sourceRow.discountType || "None");
        else if (selectedField === "Discount %" || selectedField === "Discount") {
          row[label] = sourceRow.discountPct !== undefined ? `${sourceRow.discountPct}%` : (sourceRow.discountAmt ? `PKR ${sourceRow.discountAmt}` : "0");
        }
        else if (selectedField === "Final Amount") row[label] = sourceRow.finalAmt ? `PKR ${sourceRow.finalAmt}` : "0";
        else if (selectedField === "Utilisation %" || selectedField === "Rate %") {
          row[label] = (Number(sourceRow.capacity || 0) > 0 ? `${Math.round((Number(sourceRow.enrolled || 0) / Number(sourceRow.capacity || 1)) * 100)}%` : (sourceRow.rate ? `${sourceRow.rate}%` : "100%"));
        }
        else if (selectedField === "Registration Date" || selectedField === "Issued Date" || selectedField === "Due Date" || selectedField === "Date" || selectedField === "Last Marked" || selectedField === "Last Awarded") {
          row[label] = String(sourceRow.registeredDate || sourceRow.issuedDate || sourceRow.dueDate || sourceRow.date || sourceRow.lastMarked || sourceRow.lastAwarded || "—");
        }
        else {
          const rawValue = sourceRow[camel] !== undefined ? sourceRow[camel] : sourceRow[selectedField.toLowerCase().replace(/ /g, "")];
          row[label] = rawValue !== undefined ? String(rawValue) : "—";
        }
      });
      return row;
    });

    // Apply Aggregations & Grouping
    if (groupBy && aggregate !== "None") {
      const groupByLabel = resolveFieldLabel(groupBy);
      const groups: Record<string, PreviewRow[]> = {};
      processedRows.forEach((row) => {
        const groupValue = String(row[groupByLabel] || "Unspecified");
        if (!groups[groupValue]) groups[groupValue] = [];
        groups[groupValue].push(row);
      });

      processedRows = Object.entries(groups).map(([groupName, rows]) => {
        const summaryRow: PreviewRow = { [groupByLabel]: groupName };
        selectedFields.forEach((selectedField) => {
          if (selectedField === groupBy) return;
          const fieldLabel = resolveFieldLabel(selectedField);
          const values = rows
            .map((row) => Number(String(row[fieldLabel]).replace(/[^0-9.-]/g, "")))
            .filter((value) => !isNaN(value));

          if (aggregate === "Count") {
            summaryRow[fieldLabel] = rows.length;
          } else if (values.length === 0) {
            summaryRow[fieldLabel] = "—";
          } else {
            switch (aggregate) {
              case "Sum":
                summaryRow[fieldLabel] = values.reduce((sum, value) => sum + value, 0);
                break;
              case "Average":
                summaryRow[fieldLabel] = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
                break;
              case "Max":
                summaryRow[fieldLabel] = Math.max(...values);
                break;
              case "Min":
                summaryRow[fieldLabel] = Math.min(...values);
                break;
              default:
                summaryRow[fieldLabel] = "—";
            }
          }
        });
        return summaryRow;
      });
    }

    setPreviewData(processedRows.slice(0, 20));
  }, [source, selectedFields, aggregate, groupBy, contactsColl, studentsColl, sessionsColl, financialColl, attendanceColl, hasanatColl, academicColl, t]);

  /** Appends a field to the selected columns list. */
  const addField = (field: string): void => {
    setSelectedFields((currentFields) => [...currentFields, field]);
  };

  /** Removes a field from the selected columns list. */
  const removeField = (field: string): void => {
    setSelectedFields((currentFields) => currentFields.filter((candidate) => candidate !== field));
  };

  /** Moves a field one position earlier in the columns list. */
  const moveUp = (index: number): void => {
    setSelectedFields((currentFields) => {
      const nextFields = [...currentFields];
      [nextFields[index - 1], nextFields[index]] = [nextFields[index], nextFields[index - 1]];
      return nextFields;
    });
  };

  /** Moves a field one position later in the columns list. */
  const moveDown = (index: number): void => {
    setSelectedFields((currentFields) => {
      const nextFields = [...currentFields];
      [nextFields[index + 1], nextFields[index]] = [nextFields[index], nextFields[index + 1]];
      return nextFields;
    });
  };

  const handleExportExcel = async (): Promise<void> => {
    if (previewData.length === 0) return;
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(previewData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Custom Report");
    XLSX.writeFile(workbook, `${reportName.replace(/\s+/g, "_")}.xlsx`);
  };

  const handleExportPdf = async (): Promise<void> => {
    if (previewData.length === 0) return;
    const [jsPDFModule, autoTableModule] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const jsPDF = jsPDFModule.default;
    const autoTable = autoTableModule.default;

    const doc = new jsPDF({
      orientation: orientation,
      unit: "mm",
      format: pageSize,
    });
    doc.text(reportName, 14, 15);
    const tableData = previewData.map((previewRow) => selectedFields.map((selectedField) => previewRow[selectedField]));
    autoTable(doc, {
      head: [selectedFields],
      body: tableData as string[][],
      startY: 20,
      styles: { fontSize: orientation === "l" ? 8 : 10 },
    });
    doc.save(`${reportName.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="rounded-3xl border border-border/50 bg-card/45 backdrop-blur-2xl shadow-2xl overflow-hidden text-left"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border/50 bg-card/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider leading-none">{t("reports.builder.title")}</h3>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">{t("reports.builder.subtitle")}</p>
          </div>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-9 w-9 p-0 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          type="button"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Section: Parameters Configuration */}
        <div className="space-y-5 lg:col-span-1">
          
          {/* Report name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block ml-1">
              {t("reports.builder.reportTitleLabel")}
            </label>
            <Input
              type="text"
              value={reportName}
              onChange={(event) => setReportName(event.target.value)}
              placeholder={t("reports.builder.placeholderName")}
              className="w-full text-xs font-semibold rounded-xl border border-border bg-card/50 px-4 py-2.5 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all text-foreground h-auto"
            />
          </div>

          {/* Data source */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block ml-1">
              {t("reports.builder.queryDataSource")}
            </label>
            <FormSelect
              value={source}
              onChange={(value) => {
                const newSource = value as DataSource;
                setSource(newSource);
                if (newSource === "contacts") setSelectedFields(["fullName", "lifecycleStage", "city"]);
                else if (newSource === "financial") setSelectedFields(["Student Name", "Class", "Base Fee", "Final Amount"]);
                else if (newSource === "attendance") setSelectedFields(["Student Name", "Class", "Status", "Rate %"]);
                else if (newSource === "academic") setSelectedFields(["Student Name", "Class", "Subject", "Marks", "Grade"]);
                else if (newSource === "hasanat") setSelectedFields(["Student Name", "Class", "Distributed", "Balance"]);
                else if (newSource === "sessions") setSelectedFields(["Session", "Class", "Teacher", "Enrolled"]);
                else if (newSource === "faculty") setSelectedFields(["Faculty Name", "Classes", "Sessions", "Hours/Week"]);
                else setSelectedFields(["Name", "Class", "Session", "Status"]);
              }}
              options={[
                { value: "students", label: t("reports.builder.sourceStudents") },
                { value: "contacts", label: t("contacts.reportBuilder.sourceLabel") },
                { value: "attendance", label: t("reports.builder.sourceAttendance") },
                { value: "financial", label: t("reports.builder.sourceFinancial") },
                { value: "academic", label: t("reports.builder.sourceAcademic") },
                { value: "hasanat", label: t("reports.builder.sourceHasanat") },
                { value: "sessions", label: t("reports.builder.sourceSessions") },
                { value: "faculty", label: t("reports.builder.sourceFaculty") },
              ]}
              className="w-full"
            />
          </div>

          {/* Available Fields (Column Schema Picker) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                {t("reports.builder.schemaFieldsPicker")}
              </label>
              <span className="text-[9px] text-muted-foreground font-black uppercase bg-primary/10 px-1.5 py-0.5 rounded-md text-primary">{t("reports.builder.availableCount", { count: available.length })}</span>
            </div>
            <div className="rounded-2xl border border-border bg-background/30 p-2.5 space-y-1 max-h-52 overflow-y-auto custom-scrollbar">
              {available.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground italic text-xs flex flex-col items-center gap-1">
                  <Check className="w-5 h-5 text-success" />
                  {t("reports.builder.allFieldsSelected")}
                </div>
              ) : (
                available.map((availableField) => (
                  <Button
                    key={availableField}
                    onClick={() => addField(availableField)}
                    variant="ghost"
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-primary/10 text-xs font-semibold text-left text-foreground transition-all group cursor-pointer justify-start h-auto"
                    type="button"
                  >
                    <Plus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-transform shrink-0" />
                    <span className="truncate">{resolveFieldLabel(availableField)}</span>
                  </Button>
                ))
              )}
            </div>
          </div>

          {/* Aggregates Parameters */}
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block ml-1">
                {t("reports.builder.aggregatorFunction")}
              </label>
              <FormSelect
                value={aggregate}
                onChange={(value) => setAggregate(value)}
                options={AGGREGATE_FNS.map((aggregateName) => {
                  let label = aggregateName;
                  if (aggregateName === "None") label = t("reports.builder.noGrouping");
                  else if (aggregateName === "Sum") label = t("reports.visualizer.opSum");
                  else if (aggregateName === "Average") label = t("reports.visualizer.opAvg");
                  else if (aggregateName === "Count") label = t("reports.visualizer.opCount");
                  else if (aggregateName === "Max") label = t("reports.visualizer.opMax");
                  else if (aggregateName === "Min") label = t("reports.visualizer.opMin");
                  return { value: aggregateName, label };
                })}
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block ml-1">
                {t("reports.builder.groupCategory")}
              </label>
              <FormSelect
                value={groupBy}
                disabled={aggregate === "None"}
                onChange={(value) => setGroupBy(value)}
                options={[
                  { value: "", label: t("reports.builder.noGrouping") },
                  ...selectedFields.map((selectedField) => ({ value: selectedField, label: resolveFieldLabel(selectedField) }))
                ]}
                className="w-full text-xs font-semibold rounded-xl border border-border bg-card/50 px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Document Setup */}
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block ml-1">
                {t("reports.builder.docAlignment")}
              </label>
              <div className="flex gap-1 p-1 bg-muted/30 border border-border/50 rounded-xl">
                 <Button 
                  onClick={() => setOrientation("p")}
                  variant={orientation === "p" ? "default" : "ghost"}
                  className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer h-auto ${orientation === "p" ? "bg-card text-foreground shadow-sm hover:bg-card hover:text-foreground" : "text-sidebar-muted-foreground hover:text-foreground hover:bg-muted"}`}
                  type="button"
                 >
                   {t("reports.builder.portrait")}
                 </Button>
                 <Button 
                  onClick={() => setOrientation("l")}
                  variant={orientation === "l" ? "default" : "ghost"}
                  className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer h-auto ${orientation === "l" ? "bg-card text-foreground shadow-sm hover:bg-card hover:text-foreground" : "text-sidebar-muted-foreground hover:text-foreground hover:bg-muted"}`}
                  type="button"
                 >
                   {t("reports.builder.landscape")}
                 </Button>
               </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block ml-1">
                {t("reports.builder.exportLayoutFormat")}
              </label>
              <FormSelect
                value={pageSize}
                onChange={(value) => setPageSize(value)}
                options={[
                  { value: "a4", label: t("reports.builder.formatA4") },
                  { value: "letter", label: t("reports.builder.formatLetter") },
                  { value: "a3", label: t("reports.builder.formatA3") },
                  { value: "legal", label: t("reports.builder.formatLegal") }
                ]}
                className="w-full animate-none"
              />
            </div>
          </div>

        </div>

        {/* Right Section: Drag sorting & Interactive real-time preview grid */}
        <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
          
          {/* Selected Columns Sort Row */}
          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                {t("reports.builder.selectedColumns", { count: selectedFields.length })}
              </label>
              {selectedFields.length > 0 && (
                <Button
                  onClick={() => setSelectedFields([])}
                  variant="link"
                  className="text-[9px] font-bold uppercase tracking-wider text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1 cursor-pointer h-auto p-0 hover:no-underline"
                  type="button"
                >
                  <Trash2 className="w-3.5 h-3.5" /> {t("reports.builder.clearColumns")}
                </Button>
              )}
            </div>
            <div className="rounded-2xl border border-border bg-background/30 p-3 shadow-inner">
              {selectedFields.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground italic flex flex-col items-center justify-center gap-1.5">
                  <Database className="w-6 h-6 opacity-40 text-muted-foreground" />
                  {t("reports.builder.emptyColumns")}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar text-left">
                  <AnimatePresence>
                    {selectedFields.map((selectedField, index) => (
                      <DraggableField
                        key={selectedField}
                        field={resolveFieldLabel(selectedField)}
                        onRemove={() => removeField(selectedField)}
                        onMoveUp={() => moveUp(index)}
                        onMoveDown={() => moveDown(index)}
                        isFirst={index === 0}
                        isLast={index === selectedFields.length - 1}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* Real-time preview list container */}
          <div className="space-y-3 flex-1 flex flex-col justify-end mt-4">
            <div className="flex items-center justify-between ml-1">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                  {t("reports.builder.liveVisualizer", { count: previewData.length })}
                </label>
                {groupBy && (
                  <span className="text-[9px] font-bold uppercase bg-primary/15 text-primary px-1.5 py-0.5 rounded-md">{t("reports.builder.groupedBadge")}</span>
                )}
                {aggregate !== "None" && (
                  <span className="text-[9px] font-bold uppercase bg-success/15 text-success px-1.5 py-0.5 rounded-md">
                    {t(`reports.visualizer.op${aggregate === "Average" ? "Avg" : aggregate}` as any)}
                  </span>
                )}
              </div>
              
              {/* Unified Export Bar (2026 styling) */}
              {previewData.length > 0 && (
                <div className="flex gap-2">
                  <Button 
                    onClick={handleExportExcel}
                    variant="outline"
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-success hover:text-success px-3 py-1.5 rounded-xl border border-success/30 bg-success/10 hover:bg-success/15 transition-all shadow-sm cursor-pointer h-auto"
                    type="button"
                    title={t("reports.builder.exportExcelTooltip")}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> {t("reports.builder.sheet")}
                  </Button>
                  <Button 
                    onClick={handleExportPdf}
                    variant="outline"
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-destructive hover:text-destructive px-3 py-1.5 rounded-xl border border-destructive/30 bg-destructive/10 hover:bg-destructive/15 transition-all shadow-sm cursor-pointer h-auto"
                    type="button"
                    title={t("reports.builder.exportPdfTooltip")}
                  >
                    <FileText className="w-3.5 h-3.5" /> {t("reports.builder.document")}
                  </Button>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-border/80 overflow-hidden shadow-xl bg-card/65 backdrop-blur-md flex-1 min-h-[220px]">
              {previewData.length === 0 ? (
                <div className="w-full h-full flex flex-col justify-center items-center gap-2 py-12 text-muted-foreground text-xs italic">
                  <Settings className="w-7 h-7 animate-spin text-muted-foreground opacity-30" />
                  {t("reports.builder.waitingData")}
                </div>
              ) : (
                <div className="overflow-auto max-h-72 custom-scrollbar">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40 border-b border-border/70 sticky top-0 z-10 backdrop-blur-lg">
                      <tr>
                        {selectedFields.map((selectedField) => (
                          <th key={selectedField} className="px-4 py-3.5 text-left text-[9px] font-black text-muted-foreground uppercase tracking-widest whitespace-nowrap">{selectedField}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {previewData.map((previewRow, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-primary/[0.02] transition-colors group">
                          {selectedFields.map((selectedField) => (
                            <td key={selectedField} className="px-4 py-3 text-foreground font-semibold whitespace-nowrap group-hover:text-primary transition-colors">
                              {previewRow[selectedField] !== undefined && previewRow[selectedField] !== null
                                ? String(previewRow[selectedField])
                                : <span className="text-muted-foreground/30 text-xs italic">—</span>
                              }
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {previewData.length > 0 && (
              <div className="flex items-center justify-between px-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                <span>{t("reports.builder.autoFetched")}</span>
                <span>{groupBy ? t("reports.builder.groupedBy", { field: resolveFieldLabel(groupBy) }) : t("reports.builder.flatLayout")}</span>
              </div>
            )}
          </div>

        </div>

      </div>

    </motion.div>
  );
}
