import React from "react";
import { Tag } from "lucide-react";
import { JOURNAL_TAGS } from '@/lib/data/accountingData';
import { SectionCard } from "@/components/ui/SectionCard";
import { Button } from "@/components/ui/button";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { type AppTranslationKey } from "@mms/shared";
import type { DraftForm } from "./journalEntryFormTypes";

interface JournalEntryFormTagsSectionProps {
  t: TranslationFunction;
  form: DraftForm;
  toggleTag: (tag: string) => void;
}

export function JournalEntryFormTagsSection({ t, form, toggleTag }: JournalEntryFormTagsSectionProps): React.JSX.Element {
  return (
    <SectionCard
      accentColor="info"
      icon={Tag}
      title={t("accounting.journal.form.tagsTitle")}
      className="shadow-sm text-start"
    >
      <div className="flex flex-wrap gap-1.5">
        {JOURNAL_TAGS.map((tag) => (
          <Button
            key={tag}
            type="button"
            variant={form.tags?.includes(tag) ? "default" : "outline"}
            onClick={() => toggleTag(tag)}
            aria-pressed={form.tags?.includes(tag)}
            className="min-h-11 px-2.5 py-1 rounded-full text-xs font-semibold"
          >
            {t(`accounting.journal.tag.${tag.toLowerCase()}` as AppTranslationKey)}
          </Button>
        ))}
      </div>
    </SectionCard>
  );
}
