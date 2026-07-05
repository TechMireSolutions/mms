import React, { useRef } from "react";
import { Printer } from "lucide-react";
import { getRankSuffix } from "@/tenant/features/examinations/components/gradeUtils";
import { StudentResultItem } from "@/tenant/features/examinations/components/StudentResultCard";
import { Exam } from '@/lib/data/examinationData';
import { formatDate } from "@/lib/db";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import { PRINT_NEUTRAL } from "@/lib/printBrandingTokens";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";

interface CertificatePreviewProps {
  result: StudentResultItem;
  exam: Exam;
  onClose: () => void;
}

/**
 * Preview modal displaying student certificates with print features.
 *
 * @param props - Component props.
 * @param props.result - Computed student result card details.
 * @param props.exam - Target exam details.
 * @param props.onClose - Action callback to close modal.
 * @returns The CertificatePreview component.
 */
export function CertificatePreview({ result, exam, onClose }: CertificatePreviewProps): React.ReactElement {
  const certRef = useRef<HTMLDivElement | null>(null);
  const { primary, secondary } = useBrandPalette();

  const handlePrint = () => {
    if (!certRef.current) return;
    const content = certRef.current.innerHTML;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate — ${result.student?.name || "Student"}</title>
          <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; background: white; }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 500);
  };

  const rankLabel = getRankSuffix(result.rank);
  const date = formatDate(exam.date, true);

  return (
    <Modal
      open
      onClose={onClose}
      title="Certificate Preview"
      size="lg"
      headerActions={
        <Button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90"
        >
          <Printer className="w-3.5 h-3.5" aria-hidden="true" /> Print / Download
        </Button>
      }
    >
      <div ref={certRef}>
            <div style={{
              width: "100%",
              background: PRINT_NEUTRAL.paper,
              border: `16px solid ${primary}`,
              outline: `4px solid ${secondary}`,
              outlineOffset: "-20px",
              padding: "40px 48px",
              textAlign: "center",
              fontFamily: "'Inter', sans-serif",
              position: "relative",
              minHeight: "420px",
            }}>
              {/* Corner ornaments */}
              {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((cornerPosition) => {
                const cornerStyles: React.CSSProperties = {
                  position: "absolute",
                  [cornerPosition.includes("top") ? "top" : "bottom"]: "8px",
                  [cornerPosition.includes("left") ? "left" : "right"]: "8px",
                  width: "32px",
                  height: "32px",
                  borderTop: cornerPosition.includes("top") ? `4px solid ${secondary}` : "none",
                  borderBottom: cornerPosition.includes("bottom") ? `4px solid ${secondary}` : "none",
                  borderLeft: cornerPosition.includes("left") ? `4px solid ${secondary}` : "none",
                  borderRight: cornerPosition.includes("right") ? `4px solid ${secondary}` : "none",
                };
                return <div key={cornerPosition} style={cornerStyles} />;
              })}

              {/* Arabic bismillah */}
              <p style={{ fontFamily: "'Amiri', serif", fontSize: "20px", color: primary, marginBottom: "4px" }}>
                بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
              </p>

              <div style={{ width: "60px", height: "2px", background: `linear-gradient(to right, ${secondary}, ${primary}, ${secondary})`, margin: "12px auto" }} />

              {/* Institution */}
              <p style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "4px", color: PRINT_NEUTRAL.caption, textTransform: "uppercase", marginBottom: "16px" }}>
                Madrasa Management System
              </p>

              {/* Title */}
              <h1 style={{ fontSize: "32px", fontWeight: "700", color: primary, fontFamily: "'Amiri', serif", marginBottom: "4px" }}>
                Certificate of Achievement
              </h1>
              <p style={{ fontSize: "12px", color: PRINT_NEUTRAL.subcaption, marginBottom: "24px" }}>This is to certify that</p>

              {/* Student name */}
              <h2 style={{ fontSize: "28px", fontWeight: "700", color: PRINT_NEUTRAL.text, borderBottom: `2px solid ${secondary}`, display: "inline-block", padding: "0 24px 6px", marginBottom: "20px" }}>
                {result.student?.name}
              </h2>

              {/* Body text */}
              <p style={{ fontSize: "13px", color: PRINT_NEUTRAL.body, lineHeight: "1.8", maxWidth: "480px", margin: "0 auto 20px" }}>
                has successfully completed the examination in{" "}
                <strong style={{ color: primary }}>{exam.subject}</strong> — <em>{exam.name}</em>,
                achieving a score of{" "}
                <strong style={{ color: primary }}>{result.marksObtained} out of {exam.totalMarks}</strong>{" "}
                ({result.pct}%) and securing{" "}
                <strong style={{ color: secondary }}>{rankLabel} position</strong> in class.
              </p>

              {/* Grade badge */}
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                background: result.grade.bg,
                border: `2px solid ${result.grade.border}`,
                borderRadius: "12px",
                padding: "8px 24px",
                marginBottom: "24px",
              }}>
                <span style={{ fontSize: "24px", fontWeight: "700", color: result.grade.color }}>{result.grade.label}</span>
                <span style={{ fontSize: "12px", color: PRINT_NEUTRAL.caption }}>Grade</span>
                <div style={{ width: "1px", height: "24px", background: result.grade.border }} />
                <span style={{ fontSize: "16px", fontWeight: "700", color: result.grade.color }}>{result.pct}%</span>
              </div>

              {/* Date & signatures row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "24px", borderTop: `1px solid ${PRINT_NEUTRAL.border}`, paddingTop: "16px" }}>
                <div style={{ textAlign: "left" }}>
                  <div style={{ width: "120px", borderBottom: `1px solid ${PRINT_NEUTRAL.subcaption}`, marginBottom: "4px" }} />
                  <p style={{ fontSize: "10px", color: PRINT_NEUTRAL.caption }}>Class Teacher</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "10px", color: PRINT_NEUTRAL.subcaption }}>Date of Examination</p>
                  <p style={{ fontSize: "12px", fontWeight: "600", color: PRINT_NEUTRAL.emphasis }}>{date}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ width: "120px", borderBottom: `1px solid ${PRINT_NEUTRAL.subcaption}`, marginBottom: "4px", marginLeft: "auto" }} />
                  <p style={{ fontSize: "10px", color: PRINT_NEUTRAL.caption }}>Principal / Director</p>
                </div>
              </div>
            </div>
          </div>
    </Modal>
  );
}
