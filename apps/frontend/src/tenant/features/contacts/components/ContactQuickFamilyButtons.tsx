import React from "react";
import { UserPlus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

export interface ContactQuickFamilyButtonsProps {
  onAddRelation: (relationship: "Father" | "Mother" | "Guardian") => void;
  className?: string;
}

export function ContactQuickFamilyButtons({
  onAddRelation,
  className,
}: ContactQuickFamilyButtonsProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className={className}>
      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {t("contacts.form.quickAddFamily")}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onAddRelation("Father")}
          className="h-9 rounded-xl border-primary/30 bg-primary/5 px-3 text-xs font-bold text-primary hover:bg-primary/15 hover:text-primary active:scale-95 transition-all cursor-pointer"
        >
          <UserPlus className="me-1.5 h-3.5 w-3.5" aria-hidden />
          {t("contacts.form.addFather")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onAddRelation("Mother")}
          className="h-9 rounded-xl border-primary/30 bg-primary/5 px-3 text-xs font-bold text-primary hover:bg-primary/15 hover:text-primary active:scale-95 transition-all cursor-pointer"
        >
          <UserPlus className="me-1.5 h-3.5 w-3.5" aria-hidden />
          {t("contacts.form.addMother")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onAddRelation("Guardian")}
          className="h-9 rounded-xl border-primary/30 bg-primary/5 px-3 text-xs font-bold text-primary hover:bg-primary/15 hover:text-primary active:scale-95 transition-all cursor-pointer"
        >
          <Shield className="me-1.5 h-3.5 w-3.5" aria-hidden />
          {t("contacts.form.addGuardian")}
        </Button>
      </div>
    </div>
  );
}
