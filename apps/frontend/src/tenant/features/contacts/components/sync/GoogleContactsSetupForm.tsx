import type { JSX } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldErrorMessage } from "@/components/ui/FormField";
import { FORM_ERROR_BOX, FORM_LABEL } from "@/components/ui/formStyles";
import { WarningCallout } from "@/components/ui/WarningCallout";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

export function GoogleContactsSetupHint({ t }: { t: TranslationFunction }): JSX.Element {
  return (
    <WarningCallout
      icon={AlertCircle}
      density="compact"
      role="status"
      className="gap-3 p-3 text-warning"
      title={t("contacts.sync.oauthSetupTitle")}
      description={t("contacts.sync.oauthSetupDesc")}
    />
  );
}

export function GoogleContactsSetupForm({
  clientId,
  clientSecret,
  error,
  onClientIdChange,
  onClientSecretChange,
  onSave,
  onCancel,
  t,
}: {
  clientId: string;
  clientSecret: string;
  error: string;
  onClientIdChange: (value: string) => void;
  onClientSecretChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  t: TranslationFunction;
}): JSX.Element {
  return (
    <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border">
      <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">
        {t("contacts.sync.oauthHeader")}
      </h4>
      <div>
        <label className={FORM_LABEL} htmlFor="clientId">
          {t("contacts.sync.clientIdLabel")}
        </label>
        <Input
          id="clientId"
          value={clientId}
          onChange={(event) => onClientIdChange(event.target.value)}
          placeholder={t("contacts.sync.clientIdPlaceholder")}
        />
      </div>
      <div>
        <label className={FORM_LABEL} htmlFor="clientSecret">
          {t("contacts.sync.clientSecretLabel")}
        </label>
        <Input
          id="clientSecret"
          type="password"
          value={clientSecret}
          onChange={(event) => onClientSecretChange(event.target.value)}
          placeholder={t("contacts.sync.clientSecretPlaceholder")}
        />
      </div>
      <FieldErrorMessage
        message={error || undefined}
        className={FORM_ERROR_BOX}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={onSave}
          className="px-4 min-h-11 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-none"
        >
          {t("contacts.sync.saveCredentials")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="px-4 min-h-11 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-card shadow-none"
        >
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
}
