import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { JOURNAL_TAGS } from "@/lib/data/accountingData";

interface SimpleTransactionTagSelectorProps {
  typeTag?: string;
  tags: string[];
  onChangeTags: (tags: string[]) => void;
}

export function SimpleTransactionTagSelector({
  typeTag,
  tags,
  onChangeTags,
}: SimpleTransactionTagSelectorProps) {
  const { t } = useTranslation();
  const [customTagInput, setCustomTagInput] = useState("");
  const customTags = tags.filter((tag) => !JOURNAL_TAGS.includes(tag) && tag !== typeTag);

  const toggleTag = (tag: string) => {
    const updated = tags.includes(tag)
      ? tags.filter((existingTag) => existingTag !== tag)
      : [...tags, tag];
    onChangeTags(updated);
  };

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      onChangeTags([...tags, trimmed]);
    }
    setCustomTagInput("");
  };

  return (
    <div className="sm:col-span-2 space-y-2 pt-1">
      <label className={FORM_LABEL}>{t("accounting.columns.journal.tags")}</label>
      <div className="flex flex-wrap items-center gap-1.5">
        {typeTag && (
          <Button
            type="button"
            variant={tags.includes(typeTag) ? "default" : "outline"}
            onClick={() => toggleTag(typeTag)}
            aria-pressed={tags.includes(typeTag)}
            className="min-h-9 px-2.5 py-1 rounded-full text-xs font-semibold"
          >
            {typeTag}
          </Button>
        )}
        {JOURNAL_TAGS.filter((tag) => tag !== typeTag).slice(0, 5).map((tag) => (
          <Button
            key={tag}
            type="button"
            variant={tags.includes(tag) ? "default" : "outline"}
            onClick={() => toggleTag(tag)}
            aria-pressed={tags.includes(tag)}
            className="min-h-9 px-2.5 py-1 rounded-full text-xs font-semibold"
          >
            {tag}
          </Button>
        ))}
        {customTags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="inline-flex items-center gap-1 min-h-9 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/25"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => toggleTag(tag)}
              aria-label={`Remove tag ${tag}`}
              className="hover:text-destructive transition-colors focus:outline-none"
            >
              <X className="w-3 h-3" aria-hidden="true" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Input
          id="wizard-custom-tag"
          value={customTagInput}
          onChange={(event) => setCustomTagInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleAddCustomTag();
            }
          }}
          placeholder={t("contacts.form.typeTagPlaceholder")}
          className="max-w-xs text-xs h-8"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddCustomTag}
          disabled={!customTagInput.trim()}
          className="h-8 gap-1 text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          {t("common.add")}
        </Button>
      </div>
    </div>
  );
}
