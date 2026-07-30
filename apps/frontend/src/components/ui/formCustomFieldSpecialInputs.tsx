import type React from "react";
import { BrainCircuit, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import type { FieldDefinition } from "@mms/shared";

interface SpecialFieldInputProps {
  field: FieldDefinition;
  value: unknown;
  displayValue: unknown;
  onChange: (fieldValue: unknown) => void;
}

export function CustomFieldLocationInput({ field, value, onChange }: SpecialFieldInputProps): React.JSX.Element {
  const { t } = useTranslation();
  const loc = (value as { lat: number; lng: number; address?: string }) || { lat: 24.8607, lng: 67.0011 };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Input
          id={`${field.key}-lat`}
          name={`${field.key}-lat`}
          type="number"
          step="any"
          placeholder={t("contacts.form.latitude")}
          value={loc.lat}
          onChange={(event) => onChange({ ...loc, lat: parseFloat(event.target.value) })}
        />
        <Input
          id={`${field.key}-lng`}
          name={`${field.key}-lng`}
          type="number"
          step="any"
          placeholder={t("contacts.form.longitude")}
          value={loc.lng}
          onChange={(event) => onChange({ ...loc, lng: parseFloat(event.target.value) })}
        />
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-xs text-primary font-bold">
        <MapPin className="w-3 h-3" />
        <span>{t("contacts.form.locationSetTo", { lat: loc.lat.toFixed(4), lng: loc.lng.toFixed(4) })}</span>
      </div>
    </div>
  );
}

export function CustomFieldAiSummaryInput({ field, displayValue }: SpecialFieldInputProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded w-fit">
        <BrainCircuit className="w-3 h-3" /> {t("contacts.form.aiInsights")}
      </div>
      <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground italic leading-relaxed">
        {String(displayValue) || t("contacts.form.aiSummaryPlaceholder")}
      </div>
    </div>
  );
}

export function CustomFieldRatingInput({ displayValue, onChange }: Omit<SpecialFieldInputProps, "field" | "value">): React.JSX.Element {
  const { t } = useTranslation();
  const currentRating = Number(displayValue || 0);

  return (
    <div className="flex items-center gap-1.5 pt-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1;
        return (
          <Button
            key={index}
            type="button"
            variant="ghost"
            onClick={() => onChange(starValue)}
            className={`w-11 h-11 p-0 flex items-center justify-center transition-all hover:scale-125 hover:bg-transparent ${
              starValue <= currentRating ? "text-primary hover:text-primary" : "text-muted-foreground/30 hover:text-muted-foreground/40"
            }`}
          >
            <Star className={`w-5 h-5 ${starValue <= currentRating ? "fill-primary" : "fill-transparent"}`} />
          </Button>
        );
      })}
      {currentRating > 0 && (
        <span className="text-xs text-muted-foreground ms-2 font-medium">
          {currentRating} {t("contacts.form.outOf5Stars")}
        </span>
      )}
    </div>
  );
}
