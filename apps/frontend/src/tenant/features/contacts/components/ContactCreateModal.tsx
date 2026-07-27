import React, { lazy, Suspense, useMemo } from "react";
import { type Contact, toTitleCase } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactMutations } from "@/tenant/features/contacts/hooks/useContacts";

const ContactForm = lazy(() => import("@/tenant/features/contacts/components/ContactForm"));

function nameToDraft(name: string): Partial<Contact> {
  const trimmed = name.trim();
  if (!trimmed) return {};
  const parts = trimmed.split(/\s+/).map((p) => toTitleCase(p));
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
    name: parts.join(" "),
  };
}

export interface ContactCreateDefaults {
  gender?: string;
  lockGender?: boolean;
}

export interface ContactCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (contact: Contact) => void;
  initialName?: string;
  createDefaults?: ContactCreateDefaults;
}

/**
 * Canonical quick-create contact dialog — wraps the full Contacts module form.
 * Used from ContactPicker and anywhere a new person must be added inline.
 */
export default function ContactCreateModal({
  open,
  onClose,
  onCreated,
  initialName = "",
  createDefaults,
}: ContactCreateModalProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const { upsertContact } = useContactMutations();

  const initialDraft = useMemo(() => {
    const draft = nameToDraft(initialName);
    if (createDefaults?.gender) {
      draft.gender = createDefaults.gender;
    }
    return draft;
  }, [initialName, createDefaults?.gender]);

  const handleSave = async (contactPayload: Contact): Promise<void> => {
    const payload = { ...contactPayload, id: contactPayload.id ?? crypto.randomUUID() };
    const response = await upsertContact.mutateAsync(payload);
    onCreated(response.contact);
  };

  if (!open) return null;

  return (
    <Suspense fallback={<span role="status" className="sr-only">{t("common.loading")}</span>}>
      <ContactForm
        key={`create-${initialName}-${createDefaults?.gender ?? ""}`}
        open
        priority
        initialDraft={initialDraft}
        lockGender={createDefaults?.lockGender === true}
        onClose={onClose}
        onSave={handleSave}
      />
    </Suspense>
  );
}
