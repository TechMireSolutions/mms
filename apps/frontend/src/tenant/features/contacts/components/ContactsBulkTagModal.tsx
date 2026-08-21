import { useState, type JSX } from "react";
import { Tag, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";

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
  isPending,
}: ContactsBulkTagModalProps): JSX.Element | null {
  const { t } = useTranslation();
  const [tagInput, setTagInput] = useState("");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <Modal
      open={open}
      onClose={onClose}
      title={t("contacts.bulkTagTitle")}
      icon={Tag}
      size="sm"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="min-h-11 px-4 font-medium"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || tagInput.trim().length === 0}
            className="flex items-center gap-2 px-5 min-h-11 font-semibold"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Tag className="w-4 h-4" />
            )}
            <span>{t("contacts.bulkTagAdd")}</span>
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t("contacts.selectedCount", { count: selectedCount })}
        </p>
        <div className="space-y-2">
          <label htmlFor="bulk-tag-input" className="text-xs font-semibold text-foreground">
            {t("contacts.bulkTagPlaceholder")}
          </label>
          <Input
            id="bulk-tag-input"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="VIP, Donor, Sponsor..."
            autoFocus
            disabled={isPending}
            className="min-h-11"
          />
        </div>
      </form>
    </Modal>
  );
}
