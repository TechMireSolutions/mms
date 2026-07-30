import { useMemo } from "react";
import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import {
  getDisplayName,
  getPrimaryEmail,
  getPrimaryPhone,
  USER_STATUS_VALUES,
  type Contact,
  type UserStatus,
} from "@mms/shared";
import ContactPicker from "@/components/contactLink/ContactPicker";
import { FormSelect } from "@/components/ui/FormSelect";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useTranslation } from "@/hooks/useTranslation";
import { FieldError, Label } from "./AddUserModalFieldHelpers";
import type { AddUserStepProps } from "./addUserModalTypes";

export function Step1({ form, setForm, errors }: AddUserStepProps): JSX.Element {
  const { t } = useTranslation();

  const handleContactChange = (contactId: string | number | null, contact?: Contact | null): void => {
    if (!contactId || !contact) {
      setForm((previousForm) => ({ ...previousForm, contactId: null, name: "", email: "", phone: "" }));
      return;
    }
    const primaryEmail = getPrimaryEmail(contact) || "";
    const primaryPhone = getPrimaryPhone(contact) || "";
    setForm((previousForm) => ({
      ...previousForm,
      contactId: contact.id,
      name: getDisplayName(contact),
      email: primaryEmail,
      phone: primaryPhone,
    }));
  };

  const statusOptions = useMemo(() => USER_STATUS_VALUES.map((status) => ({
    value: status,
    label: t(`users.status.${status}`),
  })), [t]);

  return (
    <div className="space-y-4">
      <div>
        <ContactPicker
          label={t("users.addSearchContact")}
          value={form.contactId}
          onChange={handleContactChange}
          searchPlaceholder={t("users.addSearchPlaceholder")}
          emptyTitle={t("users.addNoContacts")}
        />
        <FieldError msg={errors.contactId} />
      </div>

      {form.contactId && form.name ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2"
        >
          <div className="flex items-center gap-3">
            <UserAvatar id={form.contactId} name={form.name} className="w-10 h-10 rounded-full text-xs font-semibold" />
            <div>
              <p className="text-sm font-bold text-foreground">{form.name}</p>
              <p className="text-xs text-muted-foreground">{form.email}</p>
            </div>
          </div>
          {form.phone ? (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> {form.phone}
            </p>
          ) : null}
        </motion.div>
      ) : null}

      <div>
        <Label>{t("users.fieldStatus")}</Label>
        <FormSelect
          value={form.status}
          onChange={(val) => setForm((previousForm) => ({ ...previousForm, status: val as UserStatus }))}
          options={statusOptions}
        />
      </div>
    </div>
  );
}
