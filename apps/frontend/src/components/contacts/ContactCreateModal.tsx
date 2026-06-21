import React, { lazy, Suspense, useMemo } from "react";
import type { Contact } from "@mms/shared";
import { notify } from "@/lib/notify";
import useTranslation from "@/hooks/useTranslation";
import { useContactMutations } from "@/hooks/useContacts";

const ContactForm = lazy(() => import("./ContactForm"));

function nameToDraft(name: string): Partial<Contact> {
  const trimmed = name.trim();
  if (!trimmed) return {};
  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
    name: trimmed,
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

  const handleSave = (data: Contact): void => {
    const payload = { ...data, id: data.id ?? crypto.randomUUID() };
    void upsertContact
      .mutateAsync(payload)
      .then((res) => {
        onCreated(res.contact);
        onClose();
      })
      .catch(() => {
        notify.error(t("settings.serverSaveFailed"));
      });
  };

  if (!open) return null;

  return (
    <Suspense fallback={null}>
      <ContactForm
        key={`create-${initialName}-${createDefaults?.gender ?? ""}`}
        open
        initialDraft={initialDraft}
        lockGender={createDefaults?.lockGender === true}
        onClose={onClose}
        onSave={handleSave}
      />
    </Suspense>
  );
}
