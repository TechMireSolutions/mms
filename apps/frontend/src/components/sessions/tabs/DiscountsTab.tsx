import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit2, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import { Session, Discount } from '@/lib/data/sessionsData';
import { FormModal } from "@/components/ui/FormModal";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSelect } from "../../ui/FormSelect";

const EMPTY: Partial<Discount> = { name: "", type: "percentage", value: 0, conditions: "", active: true };

interface DiscountModalProps {
  open: boolean;
  discount: Discount | null;
  onClose: () => void;
  onSave: (discount: Discount) => void;
}

function DiscountModal({ open, discount, onClose, onSave }: DiscountModalProps) {
  const [discountDraft, setDiscountDraft] = useState<Partial<Discount>>(discount ? { ...discount } : { ...EMPTY });
  const updateDiscountDraft = <K extends keyof Discount>(field: K, value: Discount[K]) => setDiscountDraft((currentDraft) => ({ ...currentDraft, [field]: value }));

  React.useEffect(() => {
    if (open) {
      setDiscountDraft(discount ? { ...discount } : { ...EMPTY });
    }
  }, [open, discount]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={discount ? "Edit Discount" : "Add Discount"}
      icon={Tag}
      cancelLabel="Cancel"
      saveLabel="Save"
      onSave={() => onSave({ ...discountDraft, id: discount?.id || `d${Date.now()}` } as Discount)}
      saveDisabled={!discountDraft.name}
    >
      <div className="space-y-4">
        <div>
          <label className={FORM_LABEL} htmlFor="discount-name">Name *</label>
          <Input id="discount-name" value={discountDraft.name || ""} onChange={(event) => updateDiscountDraft("name", event.target.value)} placeholder="e.g. Sibling Discount" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="discount-type">Type</label>
            <FormSelect
              id="discount-type"
              value={discountDraft.type || "percentage"}
              onChange={(value) => updateDiscountDraft("type", value as Discount["type"])}
              options={[
                { value: "percentage", label: "Percentage (%)" },
                { value: "fixed", label: "Fixed Amount" },
              ]}
              className="w-full"
            />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="discount-value">Value</label>
            <Input id="discount-value" type="number" value={discountDraft.value || 0} onChange={(event) => updateDiscountDraft("value", +event.target.value)} min={0} max={discountDraft.type === "percentage" ? 100 : undefined} required />
          </div>
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="discount-conditions">Conditions</label>
          <Textarea id="discount-conditions" className="min-h-[64px] resize-none" value={discountDraft.conditions || ""} onChange={(event) => updateDiscountDraft("conditions", event.target.value)} placeholder="Who qualifies for this discount?" />
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <Checkbox checked={discountDraft.active || false} onCheckedChange={(checked) => updateDiscountDraft("active", !!checked)} />
          <span className="text-sm text-foreground font-medium">Active</span>
        </label>
      </div>
    </FormModal>
  );
}

interface DiscountsTabProps {
  session: Session;
  onUpdate: (session: Session) => void;
}

/**
 * DiscountsTab Component
 *
 * Renders the discounts tab for a session, allowing managing individual discounts.
 *
 * @param {DiscountsTabProps} props - The component props.
 * @returns {React.ReactElement}
 */
export function DiscountsTab({ session, onUpdate }: DiscountsTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [editDiscount, setEditDiscount] = useState<Discount | null>(null);
  const discounts = session.discounts || [];

  const handleSave = (discountToSave: Discount) => {
    const existing = discounts.find((discountItem) => discountItem.id === discountToSave.id);
    onUpdate({ ...session, discounts: existing ? discounts.map((discountItem) => discountItem.id === discountToSave.id ? discountToSave : discountItem) : [...discounts, discountToSave] });
    setShowModal(false); setEditDiscount(null);
  };

  const handleDelete = (id: string) => onUpdate({ ...session, discounts: discounts.filter((discountItem) => discountItem.id !== id) });

  const toggleActive = (id: string) => onUpdate({
    ...session,
    discounts: discounts.map((discountItem) => discountItem.id === id ? { ...discountItem, active: !discountItem.active } : discountItem),
  });

  return (
    <section aria-label="Session Discounts" className="space-y-4">
      <header className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground m-0">{discounts.length} discount{discounts.length !== 1 ? "s" : ""}</p>
        <Button
          onClick={() => { setEditDiscount(null); setShowModal(true); }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors h-auto"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Discount
        </Button>
      </header>

      {discounts.length === 0 ? (
        <div className="py-12 text-center rounded-xl border-2 border-dashed border-border">
          <Tag className="w-8 h-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground m-0">No discounts yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {discounts.map((discountItem, index) => (
            <motion.article
              key={discountItem.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${discountItem.active ? "bg-card border-border" : "bg-muted/30 border-border opacity-60"}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${discountItem.active ? "bg-primary/10" : "bg-muted"}`} aria-hidden="true">
                <Tag className={`w-4.5 h-4.5 ${discountItem.active ? "text-primary" : "text-muted-foreground"}`} style={{ width: 18, height: 18 }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="text-[13px] font-bold text-foreground m-0">{discountItem.name}</h4>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${discountItem.active ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border"}`}>
                    {discountItem.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-[13px] font-semibold text-primary m-0">
                  {discountItem.type === "percentage" ? `${discountItem.value}% off` : `PKR ${discountItem.value} off`}
                </p>
                {discountItem.conditions && <p className="text-[11px] text-muted-foreground mt-0.5 m-0">{discountItem.conditions}</p>}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Button aria-label={discountItem.active ? "Deactivate" : "Activate"} onClick={() => toggleActive(discountItem.id)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors w-8 h-8" title={discountItem.active ? "Deactivate" : "Activate"} variant="ghost" size="icon">
                  {discountItem.active ? <ToggleRight className="w-4 h-4 text-primary" aria-hidden="true" /> : <ToggleLeft className="w-4 h-4" aria-hidden="true" />}
                </Button>
                <Button aria-label={`Edit ${discountItem.name}`} onClick={() => { setEditDiscount(discountItem); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors w-8 h-8" variant="ghost" size="icon">
                  <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                </Button>
                <Button aria-label={`Delete ${discountItem.name}`} onClick={() => handleDelete(discountItem.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors w-8 h-8" variant="ghost" size="icon">
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </Button>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      <DiscountModal
        open={showModal}
        discount={editDiscount}
        onClose={() => { setShowModal(false); setEditDiscount(null); }}
        onSave={handleSave}
      />
    </section>
  );
}
