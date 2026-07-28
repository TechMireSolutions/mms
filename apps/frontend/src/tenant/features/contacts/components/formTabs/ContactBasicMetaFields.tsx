import React from "react";
import { FileText, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/FormPrimitives";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { Contact, formatCnic } from "@mms/shared";

export function ContactBasicMetaFields({
  contactDraft,
  formInstanceId,
  isFieldEnabled,
  getFieldError,
  updateDraft,
}: {
  contactDraft: Partial<Contact>;
  formInstanceId: string;
  isFieldEnabled: (tabId: string, fieldId: string) => boolean;
  getFieldError: (fieldId: string) => string | undefined;
  updateDraft: (patch: Partial<Contact>) => void;
}): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      {isFieldEnabled("basic", "dob") && (
        <Field
          label={t("contacts.fields.dob")}
          error={getFieldError("dob")}
          id={`cf-${formInstanceId}-dob`}
        >
          <DatePicker
            id={`cf-${formInstanceId}-dob`}
            name="dob"
            value={contactDraft.dob || undefined}
            onChange={(dateStr) => updateDraft({ dob: dateStr })}
          />
        </Field>
      )}

      {isFieldEnabled("basic", "cnic") && (
        <Field
          label={t("contacts.form.cnic")}
          id={`cf-${formInstanceId}-cnic`}
          error={getFieldError("cnic")}
        >
          <div className="relative flex items-center group/input">
            <FileText className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
            <Input
              id={`cf-${formInstanceId}-cnic`}
              name="cnic"
              value={contactDraft.cnic || ""}
              onChange={(e) => {
                const formatted = formatCnic(e.target.value);
                updateDraft({ cnic: formatted });
              }}
              placeholder={t("contacts.form.cnicPlaceholder")}
              className="ps-10"
            />
          </div>
        </Field>
      )}

      {isFieldEnabled("basic", "isSyed") && (
        <div className="flex flex-col justify-end min-h-[44px]">
          <label
            htmlFor="isSyed"
            className={cn(
              "flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none",
              contactDraft.isSyed
                ? "bg-primary/10 border-primary/40 text-primary font-bold shadow-sm"
                : "bg-muted/30 border-border/70 hover:bg-muted/50 text-muted-foreground",
            )}
          >
            <Checkbox
              id="isSyed"
              name="isSyed"
              checked={Boolean(contactDraft.isSyed)}
              onCheckedChange={(checked) => updateDraft({ isSyed: Boolean(checked) })}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <Star
              className={cn(
                "w-4 h-4 transition-colors",
                contactDraft.isSyed ? "fill-primary text-primary" : "text-muted-foreground/60",
              )}
            />
            <span className="text-xs font-semibold">{t("contacts.fields.isSyed")}</span>
          </label>
        </div>
      )}

      {isFieldEnabled("basic", "notes") && (
        <div className="pt-2 md:col-span-2">
          <Field
            label={t("contacts.form.notes")}
            error={getFieldError("notes")}
            id={`cf-${formInstanceId}-notes`}
          >
            <Textarea
              id={`cf-${formInstanceId}-notes`}
              name="notes"
              value={(contactDraft.notes as string) || ""}
              onChange={(e) => updateDraft({ notes: e.target.value })}
              placeholder={t("contacts.form.notesPlaceholder")}
              rows={3}
              className="w-full"
            />
          </Field>
        </div>
      )}
    </>
  );
}
