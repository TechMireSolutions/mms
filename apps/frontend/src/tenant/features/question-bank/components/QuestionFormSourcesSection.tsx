import { BookOpen } from "lucide-react";
import { type AppTranslationKey, type ModuleFieldDef, type QuestionSourceBook, type QuestionSourceFieldId } from "@mms/shared";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { QuestionSourcesTab } from "@/tenant/features/question-bank/components/QuestionSourcesTab";

import type { QuestionFormDraft, UpdateQuestionDraft } from "./questionFormTypes";

interface QuestionFormSourcesSectionProps {
  questionDraft: QuestionFormDraft;
  updateDraft: UpdateQuestionDraft;
  sourceBooks: QuestionSourceBook[];
  onPersistBook: (book: QuestionSourceBook) => Promise<void> | void;
  onRemoveBook: (bookId: string) => Promise<void> | void;
}

export function QuestionFormSourcesSection({
  questionDraft,
  updateDraft,
  sourceBooks,
  onPersistBook,
  onRemoveBook,
}: QuestionFormSourcesSectionProps): React.JSX.Element {
  const { t } = useTranslation();
  const sourceFields: ModuleFieldDef[] = [
    { id: "sourceSurah", label: t("questionBank.source.surah"), type: "text", required: false, enabled: true },
    { id: "sourceAyah", label: t("questionBank.source.ayah"), type: "text", required: false, enabled: true },
    { id: "sourceHadithNumber", label: t("questionBank.source.hadithNumber"), type: "text", required: false, enabled: true },
    { id: "sourceBookName", label: t("questionBank.source.bookName"), type: "text", required: false, enabled: true },
    { id: "sourcePageNumber", label: t("questionBank.source.pageNumber"), type: "text", required: false, enabled: true },
  ];
  const availableFieldIds: QuestionSourceFieldId[] = ["sourceSurah", "sourceAyah", "sourceHadithNumber", "sourceBookName", "sourcePageNumber"];

  return (
    <div className="space-y-5 text-start">
      <Card accentColor="primary" className="p-5.5 px-6.5 pb-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-4">
          <BookOpen className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("questionBank.formTab.sources")}</h3>
        </div>
        <QuestionSourcesTab
          sourceBooks={sourceBooks}
          citations={questionDraft.sourceCitations}
          availableFieldIds={availableFieldIds}
          orderedSourceFields={sourceFields}
          onCitationsChange={(next) => updateDraft({ sourceCitations: next })}
          onPersistBook={onPersistBook}
          onRemoveBook={onRemoveBook}
          fieldLabel={(id, fallback) => fallback ?? String(id)}
          translate={(key) => t(key as AppTranslationKey)}
        />
      </Card>
    </div>
  );
}
