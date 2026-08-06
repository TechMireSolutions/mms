import { useMemo, type JSX } from "react";
import { type Contact } from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { buildContactsMap } from "@/lib/contacts/contactI18n";
import { useTranslation } from "@/hooks/useTranslation";
import { DirectoryCardsGrid } from "@/components/ui/DirectoryCardsGrid";
import { DirectoryCardsSelectAllBar } from "@/components/ui/DirectoryCardsSelectAllBar";
import type { ContactsColumnConfig } from "@/tenant/features/contacts/components/ContactTableRow";
import { ContactCardItem } from "@/tenant/features/contacts/components/ContactCardItem";

/** Columns shown in the card header/pills — excluded from the metadata grid. */
const CONTACT_CARD_FACE_COLUMN_IDS = new Set([
  "name",
  "phone",
  "email",
  "gender",
  "isSyed",
]);

interface ContactCardsProps {
  contacts: Contact[];
  selected: (string | number)[];
  onSelect: (id: string | number) => void;
  onView?: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string | number) => void;
  onRestore?: (id: string | number) => void;
  showArchived?: boolean;
  onWhatsApp?: (contacts: Contact[]) => void;
  onSms?: (contacts: Contact[]) => void;
  onEmail?: (contacts: Contact[]) => void;
  allContacts?: Contact[];
  canWrite?: boolean;
  canDelete?: boolean;
  columns?: ContactsColumnConfig[];
  onSelectAll?: () => void;
  allSelected?: boolean;
  someSelected?: boolean;
}

/** Mobile-first card directory with dynamic, config-driven preferences. */
export default function ContactCards({
  contacts,
  selected,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onRestore,
  showArchived = false,
  onWhatsApp,
  onSms,
  onEmail,
  allContacts = [],
  canWrite = false,
  canDelete = false,
  columns = [],
  onSelectAll,
  allSelected = false,
  someSelected = false,
}: ContactCardsProps): JSX.Element {
  const { t } = useTranslation();
  const { prefs, countryCodesMap, countryCodes } = useContactConfig();

  const isColumnVisible = (id: string): boolean =>
    columns.length === 0 || columns.some((col) => col.id === id);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const contactsMap = useMemo(() => buildContactsMap(allContacts), [allContacts]);

  const otherColumns = useMemo(
    () => columns.filter((col) => !CONTACT_CARD_FACE_COLUMN_IDS.has(col.id)),
    [columns],
  );

  const pageCountLabel = `${contacts.length} ${
    contacts.length === 1 ? t("contacts.form.contact") : t("contacts.table.contacts")
  }`;

  return (
    <>
      {onSelectAll && contacts.length > 0 ? (
        <DirectoryCardsSelectAllBar
          checkboxId="contacts-select-all-cards"
          allSelected={allSelected}
          someSelected={someSelected}
          onSelectAll={onSelectAll}
          selectLabel={t("contacts.table.selectAll")}
          deselectLabel={t("common.deselect")}
          selectedCount={selected.length}
          selectedCountLabel={t("contacts.selectedCount", { count: selected.length })}
          pageCountLabel={pageCountLabel}
        />
      ) : null}

      <DirectoryCardsGrid>
        {contacts.map((contact) => (
          <ContactCardItem
            key={contact.id}
            contact={contact}
            isSelected={selectedSet.has(contact.id)}
            prefs={prefs}
            countryCodesMap={countryCodesMap}
            countryCodes={countryCodes}
            contactsMap={contactsMap}
            allContacts={allContacts}
            otherColumns={otherColumns}
            isColumnVisible={isColumnVisible}
            showArchived={showArchived}
            canWrite={canWrite}
            canDelete={canDelete}
            onSelect={onSelect}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onRestore={onRestore}
            onWhatsApp={onWhatsApp}
            onSms={onSms}
            onEmail={onEmail}
          />
        ))}
      </DirectoryCardsGrid>
    </>
  );
}
