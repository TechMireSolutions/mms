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
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";

const MotionCard = motion.create(Card);

const EMPTY: Denomination = { id: "", name: "", points: 100, color: DEFAULT_DENOMINATION_COLOR, description: "", icon: "⭐", active: true };
const PRESET_ICONS = ["⭐", "🌟", "✨", "💎", "👑", "🏆", "🎖️", "📿"];

interface DenomModalProps {
  open: boolean;
  denom: Denomination | null;
  onClose: () => void;
  onSave: (denom: Denomination) => void | Promise<void>;
}

function DenomModal({ open, denom, onClose, onSave }: DenomModalProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<Denomination>(denom || { ...EMPTY });
  const [submitting, setSubmitting] = useState(false);
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
      title={denom ? t("hasanat.denominations.edit") : t("hasanat.denominations.new")}
      icon={CreditCard}
      cancelLabel={t("common.cancel")}
      saveLabel={t("hasanat.denominations.save")}
      saving={submitting}
      onSave={() => {
        void (async () => {
          setSubmitting(true);
          try {
            await onSave({ ...data, id: denom?.id || `den${Date.now()}` });
          } finally {
            setSubmitting(false);
          }
        })();
      }}
      saveDisabled={!data.name || !data.points}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-center" aria-hidden="true">
          <div className="w-24 h-14 rounded-xl flex items-center justify-center shadow-md text-white text-2xl" style={{ background: `linear-gradient(135deg, ${data.color}, ${data.color}99)` }}>
            {data.icon}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="denom-name" className={FORM_LABEL}>{t("hasanat.denominations.cardName")} *</label>
            <Input id="denom-name" className={FORM_INPUT} value={data.name} onChange={(event) => updateField("name", event.target.value)} placeholder={t("hasanat.denominations.cardNamePlaceholder")} />
          </div>
          <div>
            <label htmlFor="denom-pts" className={FORM_LABEL}>{t("hasanat.denominations.pointsValue")} *</label>
            <Input id="denom-pts" type="number" className={FORM_INPUT} value={data.points} onChange={(event) => updateField("points", +event.target.value)} min={1} />
          </div>
        </div>
        <div>
          <label htmlFor="denom-desc" className={FORM_LABEL}>{t("hasanat.denominations.description")}</label>
          <Input id="denom-desc" className={FORM_INPUT} value={data.description} onChange={(event) => updateField("description", event.target.value)} placeholder={t("hasanat.denominations.descriptionPlaceholder")} />
        </div>

        <fieldset>
          <legend className={FORM_LABEL}>{t("hasanat.denominations.icon")}</legend>
          <div className="flex gap-2 flex-wrap">
            {PRESET_ICONS.map((icon) => (
              <Button
                type="button"
                aria-pressed={data.icon === icon}
                key={icon}
                onClick={() => updateField("icon", icon)}
                className={`min-h-11 min-w-11 rounded-lg text-lg flex items-center justify-center transition-all ${data.icon === icon ? "bg-primary/15 ring-2 ring-primary" : "bg-muted hover:bg-muted/80"}`}
              >
                {icon}
              </Button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className={FORM_LABEL}>{t("hasanat.denominations.color")}</legend>
          <div className="flex gap-2 flex-wrap items-center">
            {presetColors.map((color) => (
              <Button
                type="button"
                aria-pressed={data.color === color}
                aria-label={t("hasanat.denominations.selectColor", { color })}
                key={color}
                onClick={() => updateField("color", color)}
                className={`min-h-11 min-w-11 rounded-full border-2 transition-all ${data.color === color ? "border-foreground scale-110" : "border-transparent"}`}
                style={{ background: color }}
              />
            ))}
            <label className="sr-only" htmlFor="custom-color">{t("hasanat.denominations.customColor")}</label>
            <Input id="custom-color" type="color" value={data.color} onChange={(event) => updateField("color", event.target.value)} className="min-h-11 min-w-11 rounded cursor-pointer border-0 p-0" title={t("hasanat.denominations.customColor")} />
          </div>
        </fieldset>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <Checkbox checked={data.active} onCheckedChange={(checked) => updateField("active", !!checked)} />
          <span className="text-sm font-medium text-foreground">{t("hasanat.status.active")}</span>
        </label>
      </div>
    </FormModal>
  );
}

export interface DenominationsManagerProps {
  denoms: Denomination[];
  onUpdate: (denoms: Denomination[]) => void | Promise<void>;
  canWrite?: boolean;
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
export function DenominationsManager({ denoms, onUpdate, canWrite = true }: DenominationsManagerProps) {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [editDenom, setEditDenom] = useState<Denomination | null>(null);

  const handleSave = async (denomination: Denomination) => {
    const existing = denoms.find((candidate) => candidate.id === denomination.id);
    await onUpdate(existing ? denoms.map((candidate) => candidate.id === denomination.id ? denomination : candidate) : [...denoms, denomination]);
    setShowModal(false); setEditDenom(null);
  };

  const toggleActive = (id: string) => {
    void onUpdate(denoms.map((denomination) => denomination.id === id ? { ...denomination, active: !denomination.active } : denomination));
  };
  const handleDelete = (id: string) => {
    void onUpdate(denoms.filter((denomination) => denomination.id !== id));
  };

  return (
    <section aria-label={t("hasanat.denominations.aria")} className="space-y-4">
      <header className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground m-0">{denoms.length} denomination{denoms.length !== 1 ? "s" : ""}</p>
        {canWrite && (
          <Button
            type="button"
            onClick={() => { setEditDenom(null); setShowModal(true); }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("hasanat.denominations.new")}
          </Button>
        )}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {denoms.map((denomination, index) => (
          <MotionCard
            key={denomination.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className={`p-4 ps-5.5 group ${!denomination.active ? "opacity-60" : ""}`}
          >
            <div className="absolute start-0 top-0 bottom-0 w-1 transition-colors duration-300" style={{ backgroundColor: denomination.active ? denomination.color : "hsl(var(--muted-foreground))" }} />
            {/* Card visual */}
            <header className="relative mb-3 h-16 rounded-xl flex items-center gap-3 px-4 text-primary-foreground shadow-md overflow-hidden" style={{ background: `linear-gradient(135deg, ${denomination.color}, color-mix(in srgb, ${denomination.color} 60%, transparent))` }}>
              <span className="text-3xl" aria-hidden="true">{denomination.icon}</span>
              <div>
                <h3 className="text-sm font-bold m-0">{denomination.name}</h3>
                <p className="text-xs opacity-80 m-0">{t("hasanat.denominations.pointsLabel", { points: denomination.points })}</p>
              </div>
              {!denomination.active && (
                <span className="absolute top-2 end-2 text-xs font-bold bg-background/30 text-primary-foreground px-1.5 py-0.5 rounded" aria-label={t("hasanat.denominations.inactive")}>{t("hasanat.denominations.inactive")}</span>
              )}
            </header>

            <p className="text-sm text-muted-foreground mb-3">{denomination.description || t("hasanat.denominations.noDescription")}</p>

            <footer className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground px-2 py-1 rounded-lg bg-muted">{t("hasanat.denominations.ptsShort", { points: denomination.points })}</span>
              {canWrite && (
                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
                  <Button variant="ghost" type="button" size="icon" onClick={() => toggleActive(denomination.id)} className="rounded-lg hover:bg-muted text-muted-foreground" title={denomination.active ? t("hasanat.denominations.deactivate") : t("hasanat.denominations.activate")} aria-label={denomination.active ? t("hasanat.denominations.deactivate") : t("hasanat.denominations.activate")}>
                    {denomination.active ? <ToggleRight className="w-4 h-4 text-primary" aria-hidden="true" /> : <ToggleLeft className="w-4 h-4" aria-hidden="true" />}
                  </Button>
                  <Button variant="ghost" type="button" size="icon" aria-label={`Edit ${denomination.name}`} onClick={() => { setEditDenom(denomination); setShowModal(true); }} className="rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                    <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" type="button" size="icon" aria-label={`Delete ${denomination.name}`} onClick={() => handleDelete(denomination.id)} className="rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </Button>
                </div>
              )}
            </footer>
          </MotionCard>
        ))}
      </div>

      {canWrite && (
        <DenomModal
          open={showModal}
          denom={editDenom}
          onClose={() => { setShowModal(false); setEditDenom(null); }}
          onSave={handleSave}
        />
      )}
    </section>
  );
}
