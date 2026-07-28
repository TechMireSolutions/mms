import { getDisplayName, type AppTranslationKey, type Contact } from "@mms/shared";
import type { useContactFormDraft } from "@/tenant/features/contacts/hooks/useContactFormDraft";

type FormDraft = ReturnType<typeof useContactFormDraft>;

export function ContactFormFooterStart({
  contactDraft,
  collectionCounts,
  t,
}: {
  contactDraft: Partial<Contact>;
  collectionCounts: FormDraft["collectionCounts"];
  t: (key: AppTranslationKey, params?: Record<string, string | number>) => string;
}): JSX.Element {
  if (!contactDraft.firstName) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-[11px] font-bold border border-destructive/20">
        {t("contacts.form.firstNameRequired")}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5 text-xs">
      <span className="font-bold text-foreground bg-muted/65 px-2.5 py-1 rounded-lg border border-border/60">
        {getDisplayName(contactDraft)}
      </span>
      <div className="flex items-center gap-1.5">
        {collectionCounts.filledPhones > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold border border-primary/20 text-[10px]">
            {collectionCounts.filledPhones} {t("contacts.form.phonesLabel")}
          </span>
        )}
        {collectionCounts.filledEmails > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-warning/10 text-warning font-semibold border border-warning/20 text-[10px]">
            {collectionCounts.filledEmails} {t("contacts.form.emailsLabel")}
          </span>
        )}
        {collectionCounts.filledEmergency > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-destructive/10 text-destructive font-semibold border border-destructive/20 text-[10px]">
            {collectionCounts.filledEmergency} {t("contacts.detail.emergency")}
          </span>
        )}
      </div>
    </div>
  );
}
