import React, { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "@/hooks/useTranslation";
import { FORM_LABEL, FORM_TEXTAREA } from "@/components/ui/formStyles";

export interface ConfirmAlertDialogOptionalReason {
  label: string;
  placeholder: string;
  maxLength?: number;
}

export interface ConfirmAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (reason?: string) => void;
  destructive?: boolean;
  optionalReason?: ConfirmAlertDialogOptionalReason;
}

/** Accessible confirmation dialog — replaces `window.confirm` in module flows. */
export function ConfirmAlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  destructive = false,
  optionalReason,
}: ConfirmAlertDialogProps): React.JSX.Element {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  const handleConfirm = (): void => {
    const trimmed = reason.trim();
    onConfirm(optionalReason ? (trimmed || undefined) : undefined);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {optionalReason && (
          <div className="px-1 pb-1">
            <label className={FORM_LABEL} htmlFor="confirm-reason-input">
              {optionalReason.label}
            </label>
            <textarea
              id="confirm-reason-input"
              className={FORM_TEXTAREA}
              rows={2}
              value={reason}
              maxLength={optionalReason.maxLength ?? 500}
              placeholder={optionalReason.placeholder}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel ?? t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
          >
            {confirmLabel ?? t("common.yes")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
