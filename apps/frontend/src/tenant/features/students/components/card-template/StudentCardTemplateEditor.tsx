import React, { useCallback, useMemo, useState } from "react";
import { IdCard, RotateCw } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useBranding } from "@/tenant/hooks/useBranding";
import { TemplateEditor } from "@/components/ui/TemplateEditor";
import { notify } from "@/lib/notify";
import { formatBrandingAddress, formatDate, type Student } from "@mms/shared";
import type { CardSide, StudentCardPayload, StudentCardTemplate } from "../../lib/studentCardTemplateTypes";
import {
  getDefaultStudentCardBackElements,
  getDefaultStudentCardTemplate,
} from "../../lib/studentCardTemplateDefaults";
import { getAvailableStudentCardPresets } from "../../lib/studentCardTemplatePresets";
import {
  AVAILABLE_STUDENT_CARD_FIELDS,
  loadStudentCardTemplate,
  saveStudentCardTemplate,
} from "../../lib/studentCardTemplateStore";

export interface StudentCardTemplateEditorProps {
  onClose: () => void;
  fullscreen?: boolean;
  sampleStudent?: Student | null;
  sessionNames?: string[];
  guardianName?: string;
  emergencyPhone?: string;
  bloodGroup?: string;
}

const DEMO_STUDENT_PHOTO =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80";

export function StudentCardTemplateEditor({
  onClose,
  fullscreen = true,
  sampleStudent = null,
  sessionNames = [],
  guardianName,
  emergencyPhone,
  bloodGroup,
}: StudentCardTemplateEditorProps): React.JSX.Element {
  const { t } = useTranslation();
  const branding = useBranding();
  const [activeSide, setActiveSide] = useState<CardSide>("front");

  // Keep full template with both front elements and backElements
  const [fullTemplate, setFullTemplate] = useState<StudentCardTemplate>(() =>
    loadStudentCardTemplate(branding),
  );

  const defaultFullTemplate = useMemo<StudentCardTemplate>(
    () => getDefaultStudentCardTemplate(branding),
    [branding],
  );

  const availableFields = useMemo(
    () =>
      AVAILABLE_STUDENT_CARD_FIELDS.map((field) => ({
        ...field,
        label: t(`students.cardTemplate.field.${field.field}` as Parameters<typeof t>[0]) || field.label,
      })),
    [t],
  );

  const sampleData = useMemo<StudentCardPayload>(() => {
    const institutionAddress = formatBrandingAddress(branding) || "123 Seminary Road, Karachi";
    const madrasaName = branding.madrasaName || "Madrasa Management System";
    const studentWithExtras = sampleStudent as unknown as {
      avatarUrl?: string;
      photo?: string;
      cnic?: string;
      identificationNumber?: string;
    };

    if (sampleStudent) {
      return {
        student_name: sampleStudent.name || "Muhammad Ali Raza",
        gr_number: sampleStudent.grNumber || "2026-0042",
        student_id: String(sampleStudent.studentId || sampleStudent.id || "STU-001"),
        roll_number: "14",
        session_name: sessionNames.length > 0 ? sessionNames.join(", ") : "Dars-e-Nizami Year 2",
        guardian_name: guardianName || sampleStudent.fatherName || "Muhammad Kazim",
        emergency_phone: emergencyPhone || sampleStudent.phone || "+92 300 1234567",
        phone: sampleStudent.phone || "+92 321 7654321",
        email: sampleStudent.email || "ali.student@example.com",
        blood_group: bloodGroup || "O+",
        dob: sampleStudent.dob || "2010-04-15",
        gender: sampleStudent.gender || "Male",
        city: sampleStudent.city || "Karachi",
        national_id: studentWithExtras?.cnic || studentWithExtras?.identificationNumber || "42101-1234567-1",
        photo: studentWithExtras?.avatarUrl || studentWithExtras?.photo || DEMO_STUDENT_PHOTO,
        card_terms:
          t("students.idCard.termsDefault") ||
          "This card is the property of the institution. If found, please return to the address above.",
        authorized_signature:
          t("students.idCard.principalSign") || "Principal / Authorized Signature",
        expiry_date: "2027-06-30",
        institution_name: madrasaName,
        institution_phone: branding.phone || "+92 21 34567890",
        institution_email: branding.email || "office@alhuda.edu",
        institution_address: institutionAddress,
        issue_date: formatDate(new Date()),
      };
    }

    return {
      student_name: "Muhammad Ali Raza",
      gr_number: "2026-0042",
      student_id: "STU-0012",
      roll_number: "14",
      session_name: "Dars-e-Nizami Year 2",
      guardian_name: "Muhammad Kazim",
      emergency_phone: "+92 300 1234567",
      phone: "+92 321 7654321",
      email: "ali.student@example.com",
      blood_group: "O+",
      dob: "2010-04-15",
      gender: "Male",
      city: "Karachi",
      national_id: "42101-1234567-1",
      photo: DEMO_STUDENT_PHOTO,
      card_terms:
        t("students.idCard.termsDefault") ||
        "This card is the property of the institution. If found, please return to the address above.",
      authorized_signature:
        t("students.idCard.principalSign") || "Principal / Authorized Signature",
      expiry_date: "2027-06-30",
      institution_name: madrasaName,
      institution_phone: branding.phone || "+92 21 34567890",
      institution_email: branding.email || "office@alhuda.edu",
      institution_address: institutionAddress,
      issue_date: formatDate(new Date()),
    };
  }, [branding, sampleStudent, sessionNames, guardianName, emergencyPhone, bloodGroup, t]);

  const presets = useMemo(() => {
    return getAvailableStudentCardPresets(branding).map((p) => ({
      key: p.key,
      label: t(p.nameKey as Parameters<typeof t>[0]) || p.label,
      template: {
        ...p.template,
        elements:
          activeSide === "front"
            ? p.template.elements
            : p.template.backElements && p.template.backElements.length > 0
              ? p.template.backElements
              : getDefaultStudentCardBackElements(branding),
      },
    }));
  }, [branding, t, activeSide]);

  // Current active side template passed to TemplateEditor
  const activeSideTemplate = useMemo<StudentCardTemplate>(() => {
    if (activeSide === "back") {
      const backElements =
        fullTemplate.backElements && fullTemplate.backElements.length > 0
          ? fullTemplate.backElements
          : getDefaultStudentCardBackElements(branding);
      return {
        ...fullTemplate,
        elements: backElements,
      };
    }
    return fullTemplate;
  }, [fullTemplate, activeSide, branding]);

  const activeSideDefaultTemplate = useMemo<StudentCardTemplate>(() => {
    if (activeSide === "back") {
      return {
        ...defaultFullTemplate,
        elements: getDefaultStudentCardBackElements(branding),
      };
    }
    return defaultFullTemplate;
  }, [defaultFullTemplate, activeSide, branding]);

  const handleSave = useCallback(
    (currentSideTmpl: StudentCardTemplate) => {
      try {
        const updatedFullTemplate: StudentCardTemplate = {
          ...fullTemplate,
          pageSize: currentSideTmpl.pageSize,
          orientation: currentSideTmpl.orientation,
          ...(activeSide === "front"
            ? { elements: currentSideTmpl.elements }
            : { backElements: currentSideTmpl.elements }),
        };

        saveStudentCardTemplate(updatedFullTemplate);
        setFullTemplate(updatedFullTemplate);
        notify.success(t("students.idCard.templateSaved") || "Student card template saved");
      } catch (err) {
        console.error("Failed to save student card template:", err);
        notify.error(t("templateEditor.saveFailed") || "Failed to save template");
      }
    },
    [fullTemplate, activeSide, t],
  );

  const handleSideTemplateChange = useCallback(
    (currentSideTmpl: StudentCardTemplate) => {
      setFullTemplate((prev) => ({
        ...prev,
        pageSize: currentSideTmpl.pageSize,
        orientation: currentSideTmpl.orientation,
        ...(activeSide === "front"
          ? { elements: currentSideTmpl.elements }
          : { backElements: currentSideTmpl.elements }),
      }));
    },
    [activeSide],
  );

  const sideSwitcher = (
    <div className="flex items-center gap-1 p-1 bg-muted/80 rounded-lg border border-border/80 shadow-2xs">
      <button
        type="button"
        onClick={() => setActiveSide("front")}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
          activeSide === "front"
            ? "bg-background text-foreground shadow-2xs"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <IdCard className="w-3.5 h-3.5" />
        <span>{t("students.cardTemplate.side.front") || "Front Side"}</span>
      </button>
      <button
        type="button"
        onClick={() => setActiveSide("back")}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
          activeSide === "back"
            ? "bg-background text-foreground shadow-2xs"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <RotateCw className="w-3.5 h-3.5" />
        <span>{t("students.cardTemplate.side.back") || "Back Side"}</span>
      </button>
    </div>
  );

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Side Switcher Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">
            {t("students.cardTemplate.title") || "Student ID Card Template"}
          </span>
          <span className="text-muted-foreground">({activeSide === "front" ? t("students.cardTemplate.side.front") : t("students.cardTemplate.side.back")})</span>
        </div>
        {sideSwitcher}
      </div>

      <div className="flex-1 min-h-0">
        <TemplateEditor<StudentCardPayload>
          key={`card-editor-${activeSide}-${fullTemplate.pageSize}-${fullTemplate.orientation}`}
          title={`${t("students.cardTemplate.title")} (${activeSide === "front" ? t("students.cardTemplate.side.front") : t("students.cardTemplate.side.back")})`}
          template={activeSideTemplate}
          defaultTemplate={activeSideDefaultTemplate}
          availableFields={availableFields}
          presets={presets}
          documentType="student-card"
          sampleData={sampleData}
          fullscreen={fullscreen}
          onChange={handleSideTemplateChange}
          onSave={handleSave}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

export default StudentCardTemplateEditor;

