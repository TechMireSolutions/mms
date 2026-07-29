import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Gift, Edit2 } from "lucide-react";
import { Session, TabarrukItem } from '@/lib/data/sessionsData';
import { DatePicker } from "@/components/ui/DatePicker";
import { FormModal } from "@/components/ui/FormModal";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/useTranslation";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { formatDate } from "@mms/shared";

const EMPTY: Partial<TabarrukItem> = { item: "", quantity: "", occasion: "", date: "", note: "" };

interface TabarrukModalProps {
  open: boolean;
  entry: TabarrukItem | null;
  onClose: () => void;
  onSave: (entry: TabarrukItem) => void | Promise<void>;
  saving: boolean;
}

function TabarrukModal({ open, entry, onClose, onSave, saving }: TabarrukModalProps) {
  const { t } = useTranslation();
  const [tabarrukDraft, setTabarrukDraft] = useState<Partial<TabarrukItem>>(entry ? { ...entry } : { ...EMPTY });
  const updateTabarrukDraft = (field: keyof TabarrukItem, value: string) => setTabarrukDraft((currentDraft) => ({ ...currentDraft, [field]: value }));

  React.useEffect(() => {
    if (open) {
      setTabarrukDraft(entry ? { ...entry } : { ...EMPTY });
    }
  }, [open, entry]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={entry ? t("sessions.tabarruk.edit") : t("sessions.tabarruk.add")}
      icon={Gift}
      cancelLabel={t("common.cancel")}
      saveLabel={t("common.save")}
      onSave={() => onSave({ ...tabarrukDraft, id: entry?.id || `tb${Date.now()}` } as TabarrukItem)}
      saveDisabled={!tabarrukDraft.item}
      saving={saving}
    >
      <div className="space-y-4">
        <div>
          <label className={FORM_LABEL} htmlFor="tabarruk-item">{t("sessions.tabarruk.form.item")} *</label>
          <Input id="tabarruk-item" value={tabarrukDraft.item || ""} onChange={(event) => updateTabarrukDraft("item", event.target.value)} placeholder={t("sessions.tabarruk.form.itemPlaceholder")} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="tabarruk-quantity">{t("sessions.tabarruk.form.quantity")}</label>
            <Input id="tabarruk-quantity" value={tabarrukDraft.quantity || ""} onChange={(event) => updateTabarrukDraft("quantity", event.target.value)} placeholder={t("sessions.tabarruk.form.quantityPlaceholder")} />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="tabarruk-date">{t("sessions.tabarruk.form.date")}</label>
            <DatePicker
              id="tabarruk-date"
              value={tabarrukDraft.date || ""}
              onChange={(value) => updateTabarrukDraft("date", value)}
            />
          </div>
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="tabarruk-occasion">{t("sessions.tabarruk.form.occasion")}</label>
          <Input id="tabarruk-occasion" value={tabarrukDraft.occasion || ""} onChange={(event) => updateTabarrukDraft("occasion", event.target.value)} placeholder={t("sessions.tabarruk.form.occasionPlaceholder")} />
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="tabarruk-note">{t("sessions.tabarruk.form.note")}</label>
          <Textarea id="tabarruk-note" className="min-h-[3.75rem] resize-none" value={tabarrukDraft.note || ""} onChange={(event) => updateTabarrukDraft("note", event.target.value)} placeholder={t("sessions.tabarruk.form.notePlaceholder")} />
        </div>
      </div>
    </FormModal>
  );
}

interface TabarrukTabProps {
  session: Session;
  onUpdate: (session: Session) => void | Promise<void>;
  canWrite: boolean;
}

/**
 * TabarrukTab Component
 *
 * Renders the session management tab for Tabarruk (blessed items/gifts distributed
 * to students or attendees during events). Supports viewing the list of distributed items,
 * quantities, occasions, and dates, with options to add, edit, or delete items.
 *
 * @param props - Component properties.
 * @returns React element representing the Tabarruk tracking tab UI.
 */
export function TabarrukTab({ session, onUpdate, canWrite }: TabarrukTabProps) {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState<TabarrukItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TabarrukItem | null>(null);
  const [saving, setSaving] = useState(false);
  const deletePendingRef = React.useRef(false);
  const tabarrukItems = session.tabarruk || [];

  const handleSave = async (entry: TabarrukItem) => {
    const existingEntry = tabarrukItems.find((tabarrukItem) => tabarrukItem.id === entry.id);
    setSaving(true);
    try {
      await onUpdate({
        ...session,
        tabarruk: existingEntry
          ? tabarrukItems.map((tabarrukItem) => tabarrukItem.id === entry.id ? entry : tabarrukItem)
          : [...tabarrukItems, entry],
      });
      setShowModal(false); setEditEntry(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    deletePendingRef.current = true;
    try {
      await onUpdate({ ...session, tabarruk: tabarrukItems.filter((tabarrukItem) => tabarrukItem.id !== deleteTarget.id) });
      setDeleteTarget(null);
    } finally {
      deletePendingRef.current = false;
    }
  };

  return (
    <section aria-label={t("sessions.tabarruk.ariaLabel")} className="space-y-4">
      <article className="flex items-start gap-3 px-4 py-3 rounded-xl bg-warning/10 border border-warning/20">
        <Gift className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-warning leading-relaxed m-0">
          {t("sessions.tabarruk.description")}
        </p>
      </article>

      <header className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground m-0">{t("sessions.tabarruk.count", { count: tabarrukItems.length })}</p>
        {canWrite && <Button
          onClick={() => { setEditEntry(null); setShowModal(true); }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors h-auto"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("sessions.tabarruk.add")}
        </Button>}
      </header>

      {tabarrukItems.length === 0 ? (
        <div className="py-12 text-center rounded-xl border-2 border-dashed border-border">
          <Gift className="w-8 h-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground m-0">{t("sessions.tabarruk.emptyTitle")}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div className="overflow-x-auto max-w-full">
          <table className="w-full text-sm">
            <caption className="sr-only">{t("sessions.tabarruk.tableCaption")}</caption>
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th scope="col" className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("sessions.tabarruk.form.item")}</th>
                <th scope="col" className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">{t("sessions.tabarruk.form.quantity")}</th>
                <th scope="col" className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">{t("sessions.tabarruk.form.occasion")}</th>
                <th scope="col" className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">{t("sessions.tabarruk.form.date")}</th>
                <th scope="col" className="px-4 py-2.5 w-16"><span className="sr-only">{t("common.actions")}</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {tabarrukItems.map((tabarrukItem, index) => (
                <motion.tr
                  key={tabarrukItem.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.04 }}
                  className="hover:bg-muted/20 transition-colors group"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-foreground m-0">{tabarrukItem.item}</p>
                    {tabarrukItem.note && <p className="text-xs text-muted-foreground m-0">{tabarrukItem.note}</p>}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-sm text-foreground">{tabarrukItem.quantity || "—"}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">{tabarrukItem.occasion || "—"}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">{tabarrukItem.date ? formatDate(tabarrukItem.date) : "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    {canWrite && <div className="flex items-center gap-1 justify-end">
                      <Button aria-label={t("sessions.tabarruk.editNamed", { name: tabarrukItem.item })} onClick={() => { setEditEntry(tabarrukItem); setShowModal(true); }} className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100" variant="ghost" size="icon">
                        <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </Button>
                      <Button aria-label={t("sessions.tabarruk.deleteNamed", { name: tabarrukItem.item })} onClick={() => setDeleteTarget(tabarrukItem)} className="rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100" variant="ghost" size="icon">
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </Button>
                    </div>}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <TabarrukEntryModal
        open={showModal}
        entry={editEntry}
        onClose={() => { if (!saving) { setShowModal(false); setEditEntry(null); } }}
        onSave={handleSave}
        saving={saving}
      />
      <ConfirmAlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open && !deletePendingRef.current) setDeleteTarget(null); }}
        title={t("sessions.tabarruk.confirmDeleteTitle")}
        description={t("sessions.tabarruk.confirmDeleteDescription", { name: deleteTarget?.item ?? "" })}
        confirmLabel={t("common.delete")}
        destructive
        onConfirm={() => { void handleDelete(); }}
      />
    </section>
  );
}

const TabarrukEntryModal = TabarrukModal;
