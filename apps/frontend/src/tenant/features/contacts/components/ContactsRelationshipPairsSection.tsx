import { useState } from "react";
import { Link2, Plus, Trash2 } from "lucide-react";
import type { RelationshipPair } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { REMOVE_BTN } from "@/components/ui/formPrimitiveStyles";

export interface ContactsRelationshipPairsSectionProps {
  pairs: RelationshipPair[];
  onUpdatePairs: (pairs: RelationshipPair[]) => void;
}

export function ContactsRelationshipPairsSection({
  pairs,
  onUpdatePairs,
}: ContactsRelationshipPairsSectionProps): JSX.Element {
  const { t } = useTranslation();
  const [forwardInput, setForwardInput] = useState("");
  const [inverseInput, setInverseInput] = useState("");

  const handleAddPair = () => {
    const fwd = forwardInput.trim();
    const inv = inverseInput.trim();
    if (!fwd || !inv) return;

    const newPair: RelationshipPair = {
      id: `pair_${Date.now()}`,
      forward: fwd,
      inverse: inv,
    };

    onUpdatePairs([...pairs, newPair]);
    setForwardInput("");
    setInverseInput("");
  };

  const handleRemovePair = (index: number) => {
    const nextPairs = pairs.filter((_, i) => i !== index);
    onUpdatePairs(nextPairs);
  };

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/30 border-b border-border">
        <Link2 className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground">
          {t("contacts.setup.relationshipPairsTitle") || "2-Sided Relationship Pairs"}
        </span>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-xs text-muted-foreground">
          {t("contacts.setup.relationshipPairsDesc") ||
            "Define custom 2-sided relationship pairs. When a contact is linked with the forward relationship, the system automatically creates the reciprocal relationship on the linked contact."}
        </p>

        {/* Form to add a new 2-sided pair */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto] gap-2 items-end bg-muted/20 p-3 rounded-lg border border-border/60">
          <div>
            <label className={FORM_LABEL} htmlFor="newForwardRel">
              {t("contacts.setup.forwardRelationship") || "Forward Relationship"}
            </label>
            <Input
              id="newForwardRel"
              value={forwardInput}
              onChange={(e) => setForwardInput(e.target.value)}
              placeholder="e.g. Mentor"
              className="text-xs"
            />
          </div>

          <div className="hidden sm:flex items-center justify-center pb-2 text-muted-foreground font-bold text-sm">
            &harr;
          </div>

          <div>
            <label className={FORM_LABEL} htmlFor="newInverseRel">
              {t("contacts.setup.reciprocalRelationship") || "Reciprocal / Inverse"}
            </label>
            <Input
              id="newInverseRel"
              value={inverseInput}
              onChange={(e) => setInverseInput(e.target.value)}
              placeholder="e.g. Mentee"
              className="text-xs"
            />
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleAddPair}
            disabled={!forwardInput.trim() || !inverseInput.trim()}
            className="flex items-center gap-1.5 px-3 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t("common.add") || "Add"}</span>
          </Button>
        </div>

        {/* Existing pairs list */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {pairs.map((pair, idx) => (
            <div
              key={pair.id || `pair_${idx}`}
              className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border bg-background text-xs"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-semibold text-foreground truncate">{pair.forward}</span>
                <span className="text-muted-foreground font-bold">&harr;</span>
                <span className="font-semibold text-foreground truncate">{pair.inverse}</span>
                {(pair.inverseMale || pair.inverseFemale) && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded ml-1">
                    ({pair.inverseMale ? `M: ${pair.inverseMale}` : ""}{pair.inverseMale && pair.inverseFemale ? " / " : ""}{pair.inverseFemale ? `F: ${pair.inverseFemale}` : ""})
                  </span>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemovePair(idx)}
                className={`rounded ${REMOVE_BTN}`}
                title={t("common.delete")}
              >

                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}

          {pairs.length === 0 && (
            <p className="text-xs text-muted-foreground italic py-2">
              {t("contacts.setup.noPairsDefined") || "No custom relationship pairs defined."}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
