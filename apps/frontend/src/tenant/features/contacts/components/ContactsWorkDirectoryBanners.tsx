import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { CONTACTS_MODULE_MANIFEST } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

export function ContactsWorkTruncatedBanner({
  shownCount,
  t,
}: {
  shownCount: number;
  t: TranslationFunction;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs text-warning"
      role="status"
    >
      <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      {t("contacts.workTruncated", {
        limit: CONTACTS_MODULE_MANIFEST.maxPageSize,
        total: shownCount,
      })}
    </div>
  );
}

export function ContactsWorkGenderFilterChip({
  filterGender,
  onClear,
  t,
}: {
  filterGender: string;
  onClear: () => void;
  t: TranslationFunction;
}) {
  return (
    <AnimatePresence>
      {filterGender ? (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="flex flex-wrap gap-1.5"
        >
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
            {t("contacts.genderFilter")}: {formatContactGenderLabel(filterGender, t)}{" "}
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={onClear}
              className="h-4 w-4 p-0 hover:bg-transparent hover:opacity-70"
              aria-label={t("contacts.clearFilters")}
            >
              <X className="w-3 h-3" />
            </Button>
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
