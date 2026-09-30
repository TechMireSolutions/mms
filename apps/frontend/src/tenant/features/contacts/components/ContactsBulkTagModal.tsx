import type React from "react";
import { useState } from "react";
import { Tag } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";

export interface ContactsBulkTagModalProps {
  open: boolean;
  onClose: () => void;
  selectedCount: number;
  onConfirm: (tags: string[]) => Promise<void> | void;
  isPending?: boolean;
}

export function ContactsBulkTagModal({
  open,
  onClose,
  selectedCount,
  onConfirm,
  isPending = false,
}: ContactsBulkTagModalProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const [tagInput, setTagInput] = useState("");

  if (!open) return null;

  const handleSave = async () => {
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (tags.length === 0) return;
    await onConfirm(tags);
    setTagInput("");
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={t("contacts.bulkTagTitle")}
      icon={Tag}
      size="sm"
      cancelLabel={t("common.cancel")}
      saveLabel={t("contacts.bulkTagAdd")}
      onSave={handleSave}
      saving={isPending}
      saveDisabled={isPending || tagInput.trim().length === 0}
    >
      <div className="space-y-4 text-start">
        <p className="text-sm text-muted-foreground m-0">
          {t("contacts.selectedCount", { count: selectedCount })}
        </p>
        <div className="space-y-2">
          <label htmlFor="bulk-tag-input" className={FORM_LABEL}>
            {t("contacts.bulkTagPlaceholder")}
          </label>
          <Input
            id="bulk-tag-input"
            name="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder={t("contacts.bulkTags.placeholder")}
            autoFocus
            disabled={isPending}
            className={FORM_INPUT}
          />
        </div>
      </div>
    </FormModal>
  );
}

