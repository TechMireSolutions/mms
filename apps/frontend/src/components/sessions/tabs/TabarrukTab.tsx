import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Gift, Edit2 } from "lucide-react";
import { Session, TabarrukItem } from '@/lib/data/sessionsData';
import { DatePicker } from "../../ui/DatePicker";
import { FormModal } from "@/components/ui/FormModal";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const EMPTY: Partial<TabarrukItem> = { item: "", quantity: "", occasion: "", date: "", note: "" };

interface TabarrukModalProps {
  open: boolean;
  entry: TabarrukItem | null;
  onClose: () => void;
  onSave: (entry: TabarrukItem) => void;
}

function TabarrukModal({ open, entry, onClose, onSave }: TabarrukModalProps) {
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
      title={entry ? "Edit Tabarruk" : "Add Tabarruk"}
      icon={Gift}
      cancelLabel="Cancel"
      saveLabel="Save"
      onSave={() => onSave({ ...tabarrukDraft, id: entry?.id || `tb${Date.now()}` } as TabarrukItem)}
      saveDisabled={!tabarrukDraft.item}
    >
      <div className="space-y-4">
        <div>
          <label className={FORM_LABEL} htmlFor="tabarruk-item">Item *</label>
          <Input id="tabarruk-item" value={tabarrukDraft.item || ""} onChange={(event) => updateTabarrukDraft("item", event.target.value)} placeholder="e.g. Dates (Ajwa)" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="tabarruk-quantity">Quantity</label>
            <Input id="tabarruk-quantity" value={tabarrukDraft.quantity || ""} onChange={(event) => updateTabarrukDraft("quantity", event.target.value)} placeholder="e.g. 5 kg" />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="tabarruk-date">Date</label>
            <DatePicker
              id="tabarruk-date"
              value={tabarrukDraft.date || ""}
              onChange={(value) => updateTabarrukDraft("date", value)}
            />
          </div>
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="tabarruk-occasion">Occasion</label>
          <Input id="tabarruk-occasion" value={tabarrukDraft.occasion || ""} onChange={(event) => updateTabarrukDraft("occasion", event.target.value)} placeholder="e.g. Opening Ceremony" />
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="tabarruk-note">Note</label>
          <Textarea id="tabarruk-note" className="min-h-[60px] resize-none" value={tabarrukDraft.note || ""} onChange={(event) => updateTabarrukDraft("note", event.target.value)} placeholder="Any additional notes…" />
        </div>
      </div>
    </FormModal>
  );
}

interface TabarrukTabProps {
  session: Session;
  onUpdate: (session: Session) => void;
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
export function TabarrukTab({ session, onUpdate }: TabarrukTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState<TabarrukItem | null>(null);
  const items = session.tabarruk || [];

  const handleSave = (entry: TabarrukItem) => {
    const existing = items.find((item) => item.id === entry.id);
    onUpdate({ ...session, tabarruk: existing ? items.map((item) => item.id === entry.id ? entry : item) : [...items, entry] });
    setShowModal(false); setEditEntry(null);
  };

  const handleDelete = (id: string) => onUpdate({ ...session, tabarruk: items.filter((item) => item.id !== id) });

  return (
    <section aria-label="Session Tabarruk" className="space-y-4">
      {/* Info banner */}
      <article className="flex items-start gap-3 px-4 py-3 rounded-xl bg-warning/10 border border-warning/20">
        <Gift className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-[12px] text-warning leading-relaxed m-0">
          <strong>Tabarruk</strong> refers to blessed items distributed to students and attendees during events — such as dates, Zam Zam water, or sweets — as a means of seeking blessings.
        </p>
      </article>

      <header className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground m-0">{items.length} item{items.length !== 1 ? "s" : ""} recorded</p>
        <Button
          onClick={() => { setEditEntry(null); setShowModal(true); }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors h-auto"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Tabarruk
        </Button>
      </header>

      {items.length === 0 ? (
        <div className="py-12 text-center rounded-xl border-2 border-dashed border-border">
          <Gift className="w-8 h-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground m-0">No tabarruk recorded yet</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <table className="w-full text-sm">
            <caption className="sr-only">List of Tabarruk items</caption>
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Item</th>
                <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Quantity</th>
                <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Occasion</th>
                <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Date</th>
                <th scope="col" className="px-4 py-2.5 w-16"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {items.map((item, index) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.04 }}
                  className="hover:bg-muted/20 transition-colors group"
                >
                  <td className="px-4 py-3">
                    <p className="text-[13px] font-semibold text-foreground m-0">{item.item}</p>
                    {item.note && <p className="text-[11px] text-muted-foreground m-0">{item.note}</p>}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-[13px] text-foreground">{item.quantity || "—"}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-[13px] text-muted-foreground">{item.occasion || "—"}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-[12px] text-muted-foreground">{item.date || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button aria-label={`Edit ${item.item}`} onClick={() => { setEditEntry(item); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 w-8 h-8" variant="ghost" size="icon">
                        <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </Button>
                      <Button aria-label={`Delete ${item.item}`} onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 w-8 h-8" variant="ghost" size="icon">
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TabarrukEntryModal
        open={showModal}
        entry={editEntry}
        onClose={() => { setShowModal(false); setEditEntry(null); }}
        onSave={handleSave}
      />
    </section>
  );
}

// Rename component helper to avoid clash/error with named export
const TabarrukEntryModal = TabarrukModal;
