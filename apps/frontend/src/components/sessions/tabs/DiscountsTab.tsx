import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit2, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import { Session, Discount } from '@/lib/data/sessionsData';
import FormModal from "@/components/ui/FormModal";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";

const EMPTY: Partial<Discount> = { name: "", type: "percentage", value: 0, conditions: "", active: true };

interface DiscountModalProps {
  open: boolean;
  discount: Discount | null;
  onClose: () => void;
  onSave: (discount: Discount) => void;
}

function DiscountModal({ open, discount, onClose, onSave }: DiscountModalProps) {
  const [data, setData] = useState<Partial<Discount>>(discount ? { ...discount } : { ...EMPTY });
  const upd = <K extends keyof Discount>(f: K, v: Discount[K]) => setData((d) => ({ ...d, [f]: v }));

  React.useEffect(() => {
    if (open) {
      setData(discount ? { ...discount } : { ...EMPTY });
    }
  }, [open, discount]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={discount ? "Edit Discount" : "Add Discount"}
      icon={Tag}
      size="md"
      cancelLabel="Cancel"
      saveLabel="Save"
      onSave={() => onSave({ ...data, id: discount?.id || `d${Date.now()}` } as Discount)}
      saveDisabled={!data.name}
    >
      <div className="space-y-4">
        <div>
          <label className={FORM_LABEL} htmlFor="discount-name">Name *</label>
          <input id="discount-name" className={FORM_INPUT} value={data.name || ""} onChange={(e) => upd("name", e.target.value)} placeholder="e.g. Sibling Discount" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="discount-type">Type</label>
            <select id="discount-type" className={`${FORM_INPUT} cursor-pointer`} value={data.type || "percentage"} onChange={(e) => upd("type", e.target.value as Discount["type"])}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="discount-value">Value</label>
            <input id="discount-value" type="number" className={FORM_INPUT} value={data.value || ""} onChange={(e) => upd("value", +e.target.value)} min={0} max={data.type === "percentage" ? 100 : undefined} required />
          </div>
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="discount-conditions">Conditions</label>
          <textarea id="discount-conditions" className={`${FORM_INPUT} min-h-[64px] resize-none`} value={data.conditions || ""} onChange={(e) => upd("conditions", e.target.value)} placeholder="Who qualifies for this discount?" />
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={data.active || false} onChange={(e) => upd("active", e.target.checked)} className="w-4 h-4 accent-primary" />
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
export default function DiscountsTab({ session, onUpdate }: DiscountsTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [editDiscount, setEditDiscount] = useState<Discount | null>(null);
  const discounts = session.discounts || [];

  const handleSave = (d: Discount) => {
    const existing = discounts.find((x) => x.id === d.id);
    onUpdate({ ...session, discounts: existing ? discounts.map((x) => x.id === d.id ? d : x) : [...discounts, d] });
    setShowModal(false); setEditDiscount(null);
  };

  const handleDelete = (id: string) => onUpdate({ ...session, discounts: discounts.filter((d) => d.id !== id) });

  const toggleActive = (id: string) => onUpdate({
    ...session,
    discounts: discounts.map((d) => d.id === id ? { ...d, active: !d.active } : d),
  });

  return (
    <section aria-label="Session Discounts" className="space-y-4">
      <header className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground m-0">{discounts.length} discount{discounts.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => { setEditDiscount(null); setShowModal(true); }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Discount
        </button>
      </header>

      {discounts.length === 0 ? (
        <div className="py-12 text-center rounded-xl border-2 border-dashed border-border">
          <Tag className="w-8 h-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground m-0">No discounts yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {discounts.map((d, i) => (
            <motion.article
              key={d.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${d.active ? "bg-card border-border" : "bg-muted/30 border-border opacity-60"}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${d.active ? "bg-primary/10" : "bg-muted"}`} aria-hidden="true">
                <Tag className={`w-4.5 h-4.5 ${d.active ? "text-primary" : "text-muted-foreground"}`} style={{ width: 18, height: 18 }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="text-[13px] font-bold text-foreground m-0">{d.name}</h4>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${d.active ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border"}`}>
                    {d.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-[13px] font-semibold text-primary m-0">
                  {d.type === "percentage" ? `${d.value}% off` : `PKR ${d.value} off`}
                </p>
                {d.conditions && <p className="text-[11px] text-muted-foreground mt-0.5 m-0">{d.conditions}</p>}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button aria-label={d.active ? "Deactivate" : "Activate"} onClick={() => toggleActive(d.id)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title={d.active ? "Deactivate" : "Activate"}>
                  {d.active ? <ToggleRight className="w-4 h-4 text-primary" aria-hidden="true" /> : <ToggleLeft className="w-4 h-4" aria-hidden="true" />}
                </button>
                <button aria-label={`Edit ${d.name}`} onClick={() => { setEditDiscount(d); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button aria-label={`Delete ${d.name}`} onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
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
