import React from "react";
import { Tag } from "lucide-react";
import { JOURNAL_TAGS } from '@/lib/data/accountingData';
import { Card } from "@/components/ui/card";
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
    <Card accentColor="info" className="p-0">
      <fieldset className="p-5.5 px-6.5 pb-6 border-0 m-0 text-start">
        <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-3">
          <Tag className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("accounting.journal.form.tagsTitle")}</h3>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
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
      </fieldset>
    </Card>
  );
}
