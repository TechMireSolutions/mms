import { useState, type KeyboardEvent } from "react";
import { isDuplicateRelationshipPair, type RelationshipPair } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { REMOVE_BTN } from "@/components/ui/formPrimitiveStyles";
import { Link2, Plus, Trash2 } from "lucide-react";

export interface ContactsRelationshipPairsSectionProps {
  pairs: RelationshipPair[];
  onUpdatePairs: (pairs: RelationshipPair[]) => void;
}

function genderedInverseHint(
  pair: RelationshipPair,
  maleShort: string,
  femaleShort: string,
): string | null {
  const parts: string[] = [];
  if (pair.inverseMale) parts.push(`${maleShort}: ${pair.inverseMale}`);
  if (pair.inverseFemale) parts.push(`${femaleShort}: ${pair.inverseFemale}`);
  return parts.length > 0 ? `(${parts.join(" / ")})` : null;
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

    if (isDuplicateRelationshipPair(pairs, fwd, inv)) {
      notify.warning(t("contacts.setup.duplicateRelationshipPair"));
      return;
    }

    onUpdatePairs([
      ...pairs,
      {
        id: `pair_${crypto.randomUUID()}`,
        forward: fwd,
        inverse: inv,
      },
    ]);
    setForwardInput("");
    setInverseInput("");
  };

  const handlePairInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    handleAddPair();
  };

  const handleRemovePair = (index: number) => {
    onUpdatePairs(pairs.filter((_, i) => i !== index));
  };

  const canAdd = Boolean(forwardInput.trim() && inverseInput.trim());
  const maleShort = t("contacts.setup.pairMaleShort");
  const femaleShort = t("contacts.setup.pairFemaleShort");

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/30 border-b border-border">
        <Link2 className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground">
          {t("contacts.setup.relationshipPairsTitle")}
        </span>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-xs text-muted-foreground">
          {t("contacts.setup.relationshipPairsDesc")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto] gap-2 items-end bg-muted/20 p-3 rounded-lg border border-border/60">
          <div>
            <label className={FORM_LABEL} htmlFor="newForwardRel">
              {t("contacts.setup.forwardRelationship")}
            </label>
            <Input
              id="newForwardRel"
              name="newForwardRel"
              value={forwardInput}
              onChange={(e) => setForwardInput(e.target.value)}
              onKeyDown={handlePairInputKeyDown}
              placeholder={t("contacts.setup.forwardRelationshipPlaceholder")}
              className="text-xs"
            />
          </div>

          <div className="hidden sm:flex items-center justify-center pb-2 text-muted-foreground font-bold text-sm" aria-hidden="true">
            &harr;
          </div>

          <div>
            <label className={FORM_LABEL} htmlFor="newInverseRel">
              {t("contacts.setup.reciprocalRelationship")}
            </label>
            <Input
              id="newInverseRel"
              name="newInverseRel"
              value={inverseInput}
              onChange={(e) => setInverseInput(e.target.value)}
              onKeyDown={handlePairInputKeyDown}
              placeholder={t("contacts.setup.reciprocalRelationshipPlaceholder")}
              className="text-xs"
            />
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleAddPair}
            disabled={!canAdd}
            className="flex items-center gap-1.5 px-3 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t("common.add")}</span>
          </Button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {pairs.map((pair, idx) => {
            const genderedHint = genderedInverseHint(pair, maleShort, femaleShort);
            return (
              <div
                key={pair.id || `pair_${idx}`}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border bg-background text-xs"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-semibold text-foreground truncate">{pair.forward}</span>
                  <span className="text-muted-foreground font-bold" aria-hidden="true">&harr;</span>
                  <span className="font-semibold text-foreground truncate">{pair.inverse}</span>
                  {genderedHint ? (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded ms-1">
                      {genderedHint}
                    </span>
                  ) : null}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemovePair(idx)}
                  className={`rounded ${REMOVE_BTN}`}
                  title={t("common.delete")}
                  aria-label={t("common.delete")}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })}

          {pairs.length === 0 && (
            <p className="text-xs text-muted-foreground italic py-2">
              {t("contacts.setup.noPairsDefined")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
