import React from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { QuestionBankQuestion as Question } from "@mms/shared";
import type { PaperSection } from "@/tenant/features/question-bank/components/paperBuilderUtils";

interface PaperSectionsEditorProps {
  activeSectionId: string;
  questionsById: Map<string, Question>;
  sections: PaperSection[];
  selectedCount: number;
  onAddSection: () => void;
  onRemoveQuestion: (sectionId: string, questionId: string) => void;
  onRemoveSection: (sectionId: string) => void;
  onSelectSection: (sectionId: string) => void;
  onUpdateSection: (sectionId: string, patch: Partial<PaperSection>) => void;
}

export function PaperSectionsEditor({
  activeSectionId,
  questionsById,
  sections,
  selectedCount,
  onAddSection,
  onRemoveQuestion,
  onRemoveSection,
  onSelectSection,
  onUpdateSection,
}: PaperSectionsEditorProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <section className="rounded-xl border border-border bg-card p-3 sm:p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="m-0 text-[13px] font-bold text-foreground">{t("questionBank.paperSections")}</h3>
          <p className="m-0 text-[11px] text-muted-foreground">
            {t("questionBank.selectedQuestionCount", { count: selectedCount })}
          </p>
        </div>
        <Button type="button" onClick={onAddSection} size="sm" variant="outline" className="w-full sm:w-auto">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          {t("questionBank.addSection")}
        </Button>
      </div>

      <div className="space-y-3">
        {sections.map((section, sectionIndex) => {
          const active = section.id === activeSectionId;
          return (
            <div key={section.id} className={`rounded-lg border p-3 ${active ? "border-primary bg-primary/5" : "border-border bg-muted/20"}`}>
              <div className="mb-3 flex flex-wrap items-start gap-2">
                <Button
                  type="button"
                  onClick={() => onSelectSection(section.id)}
                  variant={active ? "default" : "outline"}
                  size="sm"
                  className="h-auto px-3 py-1.5 text-xs"
                >
                  {t("questionBank.activeSection", { n: sectionIndex + 1 })}
                </Button>
                {sections.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => onRemoveSection(section.id)}
                    variant="ghost"
                    size="icon"
                    aria-label={t("questionBank.removeSectionAria", { title: section.title })}
                    className="ml-auto h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor={`section-title-${section.id}`} className={FORM_LABEL}>{t("questionBank.sectionTitle")}</label>
                  <Input
                    id={`section-title-${section.id}`}
                    className={`${FORM_INPUT} shadow-none`}
                    value={section.title}
                    onChange={(event) => onUpdateSection(section.id, { title: event.target.value })}
                    placeholder={t("questionBank.sectionTitlePlaceholder")}
                  />
                </div>
                <div>
                  <label htmlFor={`section-instructions-${section.id}`} className={FORM_LABEL}>{t("questionBank.sectionInstructions")}</label>
                  <Input
                    id={`section-instructions-${section.id}`}
                    className={`${FORM_INPUT} shadow-none`}
                    value={section.instructions}
                    onChange={(event) => onUpdateSection(section.id, { instructions: event.target.value })}
                    placeholder={t("questionBank.sectionInstructionsPlaceholder")}
                  />
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {section.questionIds.length === 0 ? (
                  <p className="m-0 rounded-lg border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
                    {t("questionBank.noSectionQuestions")}
                  </p>
                ) : (
                  section.questionIds.map((questionId, questionIndex) => {
                    const question = questionsById.get(questionId);
                    if (!question) return null;
                    return (
                      <div key={questionId} className="flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2">
                        <span className="mt-0.5 text-xs font-bold text-muted-foreground">{questionIndex + 1}.</span>
                        <p className="m-0 flex-1 text-xs font-semibold leading-snug text-foreground">{question.text}</p>
                        <Button
                          type="button"
                          onClick={() => onRemoveQuestion(section.id, questionId)}
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          aria-label={t("questionBank.removeQuestionAria", { n: questionIndex + 1 })}
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
