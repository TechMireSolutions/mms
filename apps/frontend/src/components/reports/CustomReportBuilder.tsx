import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, GripVertical, Plus, Check, Trash2, FileSpreadsheet, FileText, Settings, Database, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FormSelect from "@/components/ui/FormSelect";
import { useContactsPaginated } from '@/hooks/useContacts';
import { useStudentsPaginated } from '@/hooks/useStudents';
import { CONTACTS_MODULE_CONTRACT, STUDENTS_MODULE_CONTRACT } from '@mms/shared';
import { useSessionsCollection } from '@/hooks/useSessions';
import { useLiveCollection } from "../../hooks/useLiveCollection";
import useTranslation from "@/hooks/useTranslation";
import usePermissions from "@/hooks/usePermissions";
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
          title="Move Up"
        >
          ▲
        </Button>
        <Button
          disabled={isLast}
          onClick={onMoveDown}
          variant="ghost"
          className="w-5 h-5 flex items-center justify-center p-0 rounded-lg hover:bg-muted disabled:opacity-20 text-[10px] text-muted-foreground font-black cursor-pointer transition-colors"
          type="button"
          title="Move Down"
        >
          ▼
        </Button>
        <Button
          onClick={onRemove}
          variant="ghost"
          className="w-5 h-5 flex items-center justify-center p-0 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer transition-all"
          type="button"
          title="Remove field"
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
  const financialColl = useLiveCollection<Record<string, unknown>>("finance_invoices", []);
  const attendanceColl = useLiveCollection<Record<string, unknown>>("attendance_records", []);
  const hasanatColl = useLiveCollection<Record<string, unknown>>("hasanat_distributions", []);
  const academicColl = useLiveCollection<Record<string, unknown>>("exam_results", []);

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
  const [reportName, setReportName]       = useState<string>("My Custom Report");
  const [previewData, setPreviewData]     = useState<PreviewRow[]>([]);

  const resolveFieldLabel = (field: string): string => {
    if (source === "contacts") {
      return resolveContactReportFieldLabel(field, fieldConfig.fields, (key) => t(key as AppTranslationKey));
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
      return contactsFieldCatalog.map((f) => f.id).filter((id) => !selectedFields.includes(id));
    }
    return ALL_FIELDS[source].filter((f) => !selectedFields.includes(f));
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

    let raw: Record<string, unknown>[] = [];
    if (source === "contacts") {
      raw = contactsColl;
    } else if (source === "students") {
      raw = studentsColl;
    } else if (source === "sessions") {
      raw = sessionsColl;
    } else if (source === "financial") {
      raw = financialColl;
    } else if (source === "attendance") {
      raw = attendanceColl;
    } else if (source === "hasanat") {
      raw = hasanatColl;
    } else if (source === "academic") {
      raw = academicColl;
    } else if (source === "faculty") {
      const sessionsList = sessionsColl;
      const map: Record<string, { classes: Set<string>, sessions: Set<string>, students: number, hours: number }> = {};
      sessionsList.forEach((s) => {
        const classes = s.classes as { id: string; teacherName?: string; enrolled: number }[] | undefined;
        if (classes) {
          classes.forEach((c) => {
            const tName = c.teacherName || "Unassigned";
            if (!map[tName]) {
              map[tName] = { classes: new Set(), sessions: new Set(), students: 0, hours: 0 };
            }
            map[tName].classes.add(c.id);
            map[tName].sessions.add(String(s.id));
            map[tName].students += Number(c.enrolled || 0);
            map[tName].hours += 2; // Assuming 2 hours per class workload
          });
        }
      });
      raw = Object.entries(map).map(([name, data]) => ({
        facultyName: name,
        classes: data.classes.size,
        sessions: data.sessions.size,
        totalStudents: data.students,
        hoursWeek: data.hours,
        specialization: "General Studies",
      }));
    }

    const toCamelCase = (str: string): string => {
      const cleaned = str.replace(/[^a-zA-Z0-9 ]/g, "");
      return cleaned
        .split(" ")
        .map((word, i) => i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join("");
    };

    let processed = raw.map((item) => {
      const row: PreviewRow = {};
      const cellLabels = { yes: t("common.yes"), no: t("common.no") };
      selectedFields.forEach((field) => {
        const label = resolveFieldLabel(field);
        if (source === "contacts" && isContactsReportFieldId(field)) {
          row[label] = getContactReportCellValue(item, field as ContactsReportFieldId, cellLabels);
          return;
        }
        const camel = toCamelCase(field);
        if (field === "Name" || field === "Student Name" || field === "Faculty Name" || field === "Faculty") {
          row[label] = String(item.name || item.studentName || item.facultyName || item.faculty || "—");
        }
        else if (field === "Status") row[label] = String(item.status || "—");
        else if (field === "Class") row[label] = String(item.class || item.className || (item.classes as { name: string }[] | undefined)?.[0]?.name || "—");
        else if (field === "Session") row[label] = String(item.session || "—");
        else if (field === "Teacher") row[label] = String(item.teacher || item.teacherName || "—");
        else if (field === "Room") row[label] = String(item.room || "—");
        else if (field === "Time") row[label] = String(item.time || "—");
        else if (field === "Days") row[label] = Array.isArray(item.days) ? item.days.join(", ") : String(item.days || "—");
        else if (field === "Discount Type") row[label] = String(item.discountType || "None");
        else if (field === "Discount %" || field === "Discount") {
          row[label] = item.discountPct !== undefined ? `${item.discountPct}%` : (item.discountAmt ? `PKR ${item.discountAmt}` : "0");
        }
        else if (field === "Final Amount") row[label] = item.finalAmt ? `PKR ${item.finalAmt}` : "0";
        else if (field === "Utilisation %" || field === "Rate %") {
          row[label] = (Number(item.capacity || 0) > 0 ? `${Math.round((Number(item.enrolled || 0) / Number(item.capacity || 1)) * 100)}%` : (item.rate ? `${item.rate}%` : "100%"));
        }
        else if (field === "Registration Date" || field === "Issued Date" || field === "Due Date" || field === "Date" || field === "Last Marked" || field === "Last Awarded") {
          row[label] = String(item.registeredDate || item.issuedDate || item.dueDate || item.date || item.lastMarked || item.lastAwarded || "—");
        }
        else {
          const rawVal = item[camel] !== undefined ? item[camel] : item[field.toLowerCase().replace(/ /g, "")];
          row[label] = rawVal !== undefined ? String(rawVal) : "—";
        }
      });
      return row;
    });

    // Apply Aggregations & Grouping
    if (groupBy && aggregate !== "None") {
      const groupByLabel = resolveFieldLabel(groupBy);
      const groups: Record<string, PreviewRow[]> = {};
      processed.forEach((row) => {
        const groupVal = String(row[groupByLabel] || "Unspecified");
        if (!groups[groupVal]) groups[groupVal] = [];
        groups[groupVal].push(row);
      });

      processed = Object.entries(groups).map(([groupName, rows]) => {
        const summaryRow: PreviewRow = { [groupByLabel]: groupName };
        selectedFields.forEach((f) => {
          if (f === groupBy) return;
          const fLabel = resolveFieldLabel(f);
          const values = rows
            .map((r) => Number(String(r[fLabel]).replace(/[^0-9.-]/g, "")))
            .filter((v) => !isNaN(v));

          if (aggregate === "Count") {
            summaryRow[fLabel] = rows.length;
          } else if (values.length === 0) {
            summaryRow[fLabel] = "—";
          } else {
            switch (aggregate) {
              case "Sum":
                summaryRow[fLabel] = values.reduce((sum, v) => sum + v, 0);
                break;
              case "Average":
                summaryRow[fLabel] = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
                break;
              case "Max":
                summaryRow[fLabel] = Math.max(...values);
                break;
              case "Min":
                summaryRow[fLabel] = Math.min(...values);
                break;
              default:
                summaryRow[fLabel] = "—";
            }
          }
        });
        return summaryRow;
      });
    }

    setPreviewData(processed.slice(0, 20));
  }, [source, selectedFields, aggregate, groupBy, contactsColl, studentsColl, sessionsColl, financialColl, attendanceColl, hasanatColl, academicColl, t]);

  /** Appends a field to the selected columns list. */
  const addField = (f: string): void => {
    setSelectedFields((s) => [...s, f]);
  };

  /** Removes a field from the selected columns list. */
  const removeField = (f: string): void => {
    setSelectedFields((s) => s.filter((x) => x !== f));
  };

  /** Moves a field one position earlier in the columns list. */
  const moveUp = (i: number): void => {
    setSelectedFields((s) => {
      const a = [...s];
      [a[i - 1], a[i]] = [a[i], a[i - 1]];
      return a;
    });
  };

  /** Moves a field one position later in the columns list. */
  const moveDown = (i: number): void => {
    setSelectedFields((s) => {
      const a = [...s];
      [a[i + 1], a[i]] = [a[i], a[i + 1]];
      return a;
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
    const tableData = previewData.map((row) => selectedFields.map((f) => row[f]));
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
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider leading-none">Interactive Report Builder</h3>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">Dynamic column schemas and real-time computation</p>
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
              Report Title Label
            </label>
            <Input
              type="text"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="e.g. Active Students Roll"
              className="w-full text-xs font-semibold rounded-xl border border-border bg-card/50 px-4 py-2.5 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all text-foreground h-auto"
            />
          </div>

          {/* Data source */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block ml-1">
              Query Data Source
            </label>
            <FormSelect
              value={source}
              onChange={(val) => {
                const newSource = val as DataSource;
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
                { value: "students", label: "Students Database" },
                { value: "contacts", label: t("contacts.reportBuilder.sourceLabel") },
                { value: "attendance", label: "Attendance Ledger" },
                { value: "financial", label: "Financial Invoices" },
                { value: "academic", label: "Academic Examinations" },
                { value: "hasanat", label: "Hasanat Rewards Ledger" },
                { value: "sessions", label: "Sessions & Classrooms" },
                { value: "faculty", label: "Faculty Workload Registry" },
              ]}
              className="w-full"
            />
          </div>

          {/* Available Fields (Column Schema Picker) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                Schema Fields Picker
              </label>
              <span className="text-[9px] text-muted-foreground font-black uppercase bg-primary/10 px-1.5 py-0.5 rounded-md text-primary">{available.length} Available</span>
            </div>
            <div className="rounded-2xl border border-border bg-background/30 p-2.5 space-y-1 max-h-52 overflow-y-auto custom-scrollbar">
              {available.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground italic text-xs flex flex-col items-center gap-1">
                  <Check className="w-5 h-5 text-success" />
                  All fields selected in schema
                </div>
              ) : (
                available.map((f) => (
                  <Button
                    key={f}
                    onClick={() => addField(f)}
                    variant="ghost"
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-primary/10 text-xs font-semibold text-left text-foreground transition-all group cursor-pointer justify-start h-auto"
                    type="button"
                  >
                    <Plus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-transform shrink-0" />
                    <span className="truncate">{resolveFieldLabel(f)}</span>
                  </Button>
                ))
              )}
            </div>
          </div>

          {/* Aggregates Parameters */}
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block ml-1">
                Aggregator Function
              </label>
              <FormSelect
                value={aggregate}
                onChange={(val) => setAggregate(val)}
                options={AGGREGATE_FNS.map((a) => ({ value: a, label: a }))}
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block ml-1">
                Group Category (X)
              </label>
              <FormSelect
                value={groupBy}
                disabled={aggregate === "None"}
                onChange={(val) => setGroupBy(val)}
                options={[
                  { value: "", label: "No Grouping" },
                  ...selectedFields.map((f) => ({ value: f, label: resolveFieldLabel(f) }))
                ]}
                className="w-full text-xs font-semibold rounded-xl border border-border bg-card/50 px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Document Setup */}
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block ml-1">
                Document Alignment
              </label>
              <div className="flex gap-1 p-1 bg-muted/30 border border-border/50 rounded-xl">
                 <Button 
                  onClick={() => setOrientation("p")}
                  variant={orientation === "p" ? "default" : "ghost"}
                  className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer h-auto ${orientation === "p" ? "bg-card text-foreground shadow-sm hover:bg-card hover:text-foreground" : "text-sidebar-muted-foreground hover:text-foreground hover:bg-muted"}`}
                  type="button"
                 >
                   Portrait
                 </Button>
                 <Button 
                  onClick={() => setOrientation("l")}
                  variant={orientation === "l" ? "default" : "ghost"}
                  className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer h-auto ${orientation === "l" ? "bg-card text-foreground shadow-sm hover:bg-card hover:text-foreground" : "text-sidebar-muted-foreground hover:text-foreground hover:bg-muted"}`}
                  type="button"
                 >
                   Landscape
                 </Button>
               </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block ml-1">
                Export Layout Format
              </label>
              <FormSelect
                value={pageSize}
                onChange={(val) => setPageSize(val)}
                options={[
                  { value: "a4", label: "A4 (Standard)" },
                  { value: "letter", label: "Letter" },
                  { value: "a3", label: "A3 (Wide Ledger)" },
                  { value: "legal", label: "Legal Page" }
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
                Selected Columns Schema ({selectedFields.length})
              </label>
              {selectedFields.length > 0 && (
                <Button
                  onClick={() => setSelectedFields([])}
                  variant="link"
                  className="text-[9px] font-bold uppercase tracking-wider text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1 cursor-pointer h-auto p-0 hover:no-underline"
                  type="button"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear Columns
                </Button>
              )}
            </div>
            <div className="rounded-2xl border border-border bg-background/30 p-3 shadow-inner">
              {selectedFields.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground italic flex flex-col items-center justify-center gap-1.5">
                  <Database className="w-6 h-6 opacity-40 text-muted-foreground" />
                  Select schema fields from the left picker to construct columns
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar text-left">
                  <AnimatePresence>
                    {selectedFields.map((f, i) => (
                      <DraggableField
                        key={f}
                        field={resolveFieldLabel(f)}
                        onRemove={() => removeField(f)}
                        onMoveUp={() => moveUp(i)}
                        onMoveDown={() => moveDown(i)}
                        isFirst={i === 0}
                        isLast={i === selectedFields.length - 1}
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
                  Live Visualizer Preview ({previewData.length} records)
                </label>
                {groupBy && (
                  <span className="text-[9px] font-bold uppercase bg-primary/15 text-primary px-1.5 py-0.5 rounded-md">Grouped</span>
                )}
                {aggregate !== "None" && (
                  <span className="text-[9px] font-bold uppercase bg-success/15 text-success px-1.5 py-0.5 rounded-md">{aggregate}</span>
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
                    title="Export data to Excel Sheet"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Sheet
                  </Button>
                  <Button 
                    onClick={handleExportPdf}
                    variant="outline"
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-destructive hover:text-destructive px-3 py-1.5 rounded-xl border border-destructive/30 bg-destructive/10 hover:bg-destructive/15 transition-all shadow-sm cursor-pointer h-auto"
                    type="button"
                    title="Export layout to PDF document"
                  >
                    <FileText className="w-3.5 h-3.5" /> Document
                  </Button>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-border/80 overflow-hidden shadow-xl bg-card/65 backdrop-blur-md flex-1 min-h-[220px]">
              {previewData.length === 0 ? (
                <div className="w-full h-full flex flex-col justify-center items-center gap-2 py-12 text-muted-foreground text-xs italic">
                  <Settings className="w-7 h-7 animate-spin text-muted-foreground opacity-30" />
                  Waiting for columns configuration to map dataset...
                </div>
              ) : (
                <div className="overflow-auto max-h-72 custom-scrollbar">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40 border-b border-border/70 sticky top-0 z-10 backdrop-blur-lg">
                      <tr>
                        {selectedFields.map((h) => (
                          <th key={h} className="px-4 py-3.5 text-left text-[9px] font-black text-muted-foreground uppercase tracking-widest whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {previewData.map((row, ri) => (
                        <tr key={ri} className="hover:bg-primary/[0.02] transition-colors group">
                          {selectedFields.map((f) => (
                            <td key={f} className="px-4 py-3 text-foreground font-semibold whitespace-nowrap group-hover:text-primary transition-colors">
                              {row[f] !== undefined && row[f] !== null
                                ? String(row[f])
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
                <span>Auto-fetched 20 records for visualizer preview</span>
                <span>{groupBy ? `Grouped by: ${groupBy}` : "Flat layout model"}</span>
              </div>
            )}
          </div>

        </div>

      </div>

    </motion.div>
  );
}
