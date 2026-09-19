import React, { useState } from "react";
import { Plus, Tag, X } from "lucide-react";
import { JOURNAL_TAGS } from '@/lib/data/accountingData';
import { SectionCard } from "@/components/ui/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { type AppTranslationKey } from "@mms/shared";
import type { DraftForm } from "./journalEntryFormTypes";

interface JournalEntryFormTagsSectionProps {
  t: TranslationFunction;
  form: DraftForm;
  toggleTag: (tag: string) => void;
}

export function JournalEntryFormTagsSection({ t, form, toggleTag }: JournalEntryFormTagsSectionProps): React.JSX.Element {
  const [customTagInput, setCustomTagInput] = useState("");
  const activeTags = form.tags || [];
  const customTags = activeTags.filter((tag) => !JOURNAL_TAGS.includes(tag));

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    if (!activeTags.includes(trimmed)) {
      toggleTag(trimmed);
    }
    setCustomTagInput("");
  };

  return (
    <SectionCard
      accentColor="info"
      icon={Tag}
      title={t("accounting.journal.form.tagsTitle")}
      className="shadow-sm text-start"
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {JOURNAL_TAGS.map((tag) => (
            <Button
              key={tag}
              type="button"
              variant={activeTags.includes(tag) ? "default" : "outline"}
              onClick={() => toggleTag(tag)}
              aria-pressed={activeTags.includes(tag)}
              className="min-h-11 px-2.5 py-1 rounded-full text-xs font-semibold"
            >
              {t(`accounting.journal.tag.${tag.toLowerCase()}` as AppTranslationKey)}
            </Button>
          ))}
          {customTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="inline-flex items-center gap-1 min-h-11 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/25"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => toggleTag(tag)}
                aria-label={`Remove tag ${tag}`}
                className="hover:text-destructive transition-colors focus:outline-none"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Input
            id="journal-custom-tag-input"
            value={customTagInput}
            onChange={(event) => setCustomTagInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAddCustomTag();
              }
            }}
            placeholder={t("contacts.form.typeTagPlaceholder")}
            className="max-w-xs text-xs h-9"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddCustomTag}
            disabled={!customTagInput.trim()}
            className="h-9 gap-1 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            {t("common.add")}
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}
