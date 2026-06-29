import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, CreditCard } from "lucide-react";
import { Denomination } from '@/lib/data/hasanatData';
import { FormModal } from "@/components/ui/FormModal";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { DEFAULT_DENOMINATION_COLOR, getDenominationPresetColors } from "@/lib/denominationColors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const EMPTY: Denomination = { id: "", name: "", points: 100, color: DEFAULT_DENOMINATION_COLOR, description: "", icon: "⭐", active: true };
const PRESET_ICONS = ["⭐", "🌟", "✨", "💎", "👑", "🏆", "🎖️", "📿"];

interface DenomModalProps {
  open: boolean;
  denom: Denomination | null;
  onClose: () => void;
  onSave: (denom: Denomination) => void;
}

function DenomModal({ open, denom, onClose, onSave }: DenomModalProps) {
  const [data, setData] = useState<Denomination>(denom || { ...EMPTY });
  const presetColors = getDenominationPresetColors();
  const updateField = <K extends keyof Denomination>(field: K, value: Denomination[K]) => setData((previousData: Denomination) => ({ ...previousData, [field]: value }));

  React.useEffect(() => {
    if (open) {
      setData(denom || { ...EMPTY });
    }
  }, [open, denom]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={denom ? "Edit Denomination" : "New Denomination"}
      icon={CreditCard}
      cancelLabel="Cancel"
      saveLabel="Save"
      onSave={() => onSave({ ...data, id: denom?.id || `den${Date.now()}` })}
      saveDisabled={!data.name || !data.points}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-center" aria-hidden="true">
          <div className="w-24 h-14 rounded-xl flex items-center justify-center shadow-md text-white text-2xl" style={{ background: `linear-gradient(135deg, ${data.color}, ${data.color}99)` }}>
            {data.icon}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="denom-name" className={FORM_LABEL}>Card Name *</label>
            <Input id="denom-name" className={FORM_INPUT} value={data.name} onChange={(event) => updateField("name", event.target.value)} placeholder="e.g. Gold Card" />
          </div>
          <div>
            <label htmlFor="denom-pts" className={FORM_LABEL}>Points Value *</label>
            <Input id="denom-pts" type="number" className={FORM_INPUT} value={data.points} onChange={(event) => updateField("points", +event.target.value)} min={1} />
          </div>
        </div>
        <div>
          <label htmlFor="denom-desc" className={FORM_LABEL}>Description</label>
          <Input id="denom-desc" className={FORM_INPUT} value={data.description} onChange={(event) => updateField("description", event.target.value)} placeholder="When is this card awarded?" />
        </div>

        <fieldset>
          <legend className={FORM_LABEL}>Icon</legend>
          <div className="flex gap-2 flex-wrap">
            {PRESET_ICONS.map((icon) => (
              <Button
                type="button"
                aria-pressed={data.icon === icon}
                key={icon}
                onClick={() => updateField("icon", icon)}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${data.icon === icon ? "bg-primary/15 ring-2 ring-primary" : "bg-muted hover:bg-muted/80"}`}
              >
                {icon}
              </Button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className={FORM_LABEL}>Color</legend>
          <div className="flex gap-2 flex-wrap items-center">
            {presetColors.map((color) => (
              <Button
                type="button"
                aria-pressed={data.color === color}
                aria-label={`Select color ${color}`}
                key={color}
                onClick={() => updateField("color", color)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${data.color === color ? "border-foreground scale-110" : "border-transparent"}`}
                style={{ background: color }}
              />
            ))}
            <label className="sr-only" htmlFor="custom-color">Custom Color</label>
            <Input id="custom-color" type="color" value={data.color} onChange={(event) => updateField("color", event.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 p-0" title="Custom color" />
          </div>
        </fieldset>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <Checkbox checked={data.active} onCheckedChange={(checked) => updateField("active", !!checked)} />
          <span className="text-sm font-medium text-foreground">Active</span>
        </label>
      </div>
    </FormModal>
  );
}

export interface DenominationsManagerProps {
  denoms: Denomination[];
  onUpdate: (denoms: Denomination[]) => void;
}

/**
 * DenominationsManager Component
 *
 * Renders the management interface for reward denominations (such as Silver, Gold, or Platinum cards).
 * Provides options to create new denominations with custom colors and icons, edit existing profiles,
 * toggle active states, and delete unused denominations.
 *
 * @param props - Component properties.
 * @returns React element representing the reward card denominations manager UI.
 */
export function DenominationsManager({ denoms, onUpdate }: DenominationsManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [editDenom, setEditDenom] = useState<Denomination | null>(null);

  const handleSave = (denomination: Denomination) => {
    const existing = denoms.find((candidate) => candidate.id === denomination.id);
    onUpdate(existing ? denoms.map((candidate) => candidate.id === denomination.id ? denomination : candidate) : [...denoms, denomination]);
    setShowModal(false); setEditDenom(null);
  };

  const toggleActive = (id: string) => onUpdate(denoms.map((denomination) => denomination.id === id ? { ...denomination, active: !denomination.active } : denomination));
  const handleDelete = (id: string) => onUpdate(denoms.filter((denomination) => denomination.id !== id));

  return (
    <section aria-label="Denominations Manager" className="space-y-4">
      <header className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground m-0">{denoms.length} denomination{denoms.length !== 1 ? "s" : ""}</p>
        <Button
          type="button"
          onClick={() => { setEditDenom(null); setShowModal(true); }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> New Denomination
        </Button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {denoms.map((denomination, index) => (
          <motion.article
            key={denomination.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className={`rounded-xl border border-border bg-card p-4 group ${!denomination.active ? "opacity-60" : ""}`}
          >
            {/* Card visual */}
            <header className="relative mb-3 h-16 rounded-xl flex items-center gap-3 px-4 text-white shadow-md overflow-hidden" style={{ background: `linear-gradient(135deg, ${denomination.color}, ${denomination.color}99)` }}>
              <span className="text-3xl" aria-hidden="true">{denomination.icon}</span>
              <div>
                <h3 className="text-[13px] font-bold m-0">{denomination.name}</h3>
                <p className="text-[11px] opacity-80 m-0">{denomination.points} points</p>
              </div>
              {!denomination.active && (
                <span className="absolute top-2 right-2 text-[9px] font-bold bg-black/30 text-white px-1.5 py-0.5 rounded" aria-label="Inactive denomination">INACTIVE</span>
              )}
            </header>

            <p className="text-[12px] text-muted-foreground mb-3">{denomination.description || "No description"}</p>

            <footer className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-foreground px-2 py-1 rounded-lg bg-muted">{denomination.points} pts</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" type="button" onClick={() => toggleActive(denomination.id)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title={denomination.active ? "Deactivate" : "Activate"} aria-label={denomination.active ? "Deactivate" : "Activate"}>
                  {denomination.active ? <ToggleRight className="w-4 h-4 text-primary" aria-hidden="true" /> : <ToggleLeft className="w-4 h-4" aria-hidden="true" />}
                </Button>
                <Button variant="ghost" type="button" aria-label={`Edit ${denomination.name}`} onClick={() => { setEditDenom(denomination); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                  <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                </Button>
                <Button variant="ghost" type="button" aria-label={`Delete ${denomination.name}`} onClick={() => handleDelete(denomination.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </Button>
              </div>
            </footer>
          </motion.article>
        ))}
      </div>

      <DenomModal
        open={showModal}
        denom={editDenom}
        onClose={() => { setShowModal(false); setEditDenom(null); }}
        onSave={handleSave}
      />
    </section>
  );
}
