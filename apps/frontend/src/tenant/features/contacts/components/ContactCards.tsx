import { useMemo, type JSX } from "react";
import { motion } from "framer-motion";
import { type Contact } from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { buildContactsMap } from "@/lib/contacts/contactI18n";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { Checkbox } from "@/components/ui/checkbox";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

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
  const reducedMotion = useReducedMotion();
  const { prefs, countryCodesMap, countryCodes } = useContactConfig();

  const visibleColumnIds = useMemo(
    () => new Set(columns.map((col) => col.id)),
    [columns],
  );

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
      {onSelectAll && contacts.length > 0 && (
        <div className={cn(WORK_SURFACE, "mb-3.5 flex items-center justify-between border-border/40 px-4 py-3")}>
          <div className="flex items-center gap-2.5">
            <div className="flex min-h-11 min-w-11 items-center justify-center">
              <Checkbox
                checked={someSelected ? "indeterminate" : allSelected}
                onCheckedChange={onSelectAll}
                id="select-all-cards"
              />
            </div>
            <label htmlFor="select-all-cards" className="text-xs font-black text-muted-foreground uppercase tracking-wider select-none cursor-pointer hover:text-foreground transition-colors">
              {allSelected ? t("contacts.deselect") : t("contacts.table.selectAll")}
            </label>
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/10">
            {selected.length > 0 ? (
              <>
                {t("contacts.selectedCount", { count: selected.length })}
                <span className="mx-1.5 text-border" aria-hidden="true">
                  ·
                </span>
                {pageCountLabel}
              </>
            ) : (
              pageCountLabel
            )}
          </span>
        </div>
      )}

      <motion.div
        variants={reducedMotion ? undefined : containerVariants}
        initial={reducedMotion ? false : "hidden"}
        animate={reducedMotion ? undefined : "visible"}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
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
            visibleColumnIds={visibleColumnIds}
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
      </motion.div>
    </>
  );
}
