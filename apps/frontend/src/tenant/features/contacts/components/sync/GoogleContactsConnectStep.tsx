import { ExternalLink, Globe, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FORM_LABEL } from "@/components/ui/formStyles";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

export function GoogleContactsConnectStep({
  showAuthCode,
  authCode,
  exchanging,
  error,
  onConnect,
  onAuthCodeChange,
  onExchangeCode,
  t,
}: {
  showAuthCode: boolean;
  authCode: string;
  exchanging: boolean;
  error: string;
  onConnect: () => void;
  onAuthCodeChange: (value: string) => void;
  onExchangeCode: () => void;
  t: TranslationFunction;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t("contacts.sync.credentialsSaved")}</p>
      <Button
        type="button"
        variant="outline"
        onClick={onConnect}
        className="w-full flex items-center gap-2 px-4 min-h-11 rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted transition-colors shadow-none justify-start"
      >
        <Globe className="w-4 h-4 text-muted-foreground" />
        <span>{t("contacts.sync.connectGoogle")}</span>
        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ms-auto" />
      </Button>

      {showAuthCode && (
        <div className="space-y-2 p-3 rounded-xl bg-info/10 border border-info/30 text-info">
          <label className={FORM_LABEL} htmlFor="authCode">
            {t("contacts.sync.pasteAuthCode")}
          </label>
          <Input
            id="authCode"
            value={authCode}
            onChange={(event) => onAuthCodeChange(event.target.value)}
            placeholder={t("contacts.sync.pasteAuthCodePlaceholder")}
          />
          <Button
            type="button"
            onClick={onExchangeCode}
            disabled={!authCode.trim() || exchanging}
            className="flex items-center gap-2 px-4 min-h-11 rounded-lg bg-info text-info-foreground text-xs font-bold hover:bg-info/90 disabled:opacity-60 transition-colors border border-transparent shadow-none"
          >
            {exchanging ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Link2 className="w-3.5 h-3.5" />
            )}
            <span>{t("contacts.sync.confirmAuth")}</span>
          </Button>
        </div>
      )}

      {error && !showAuthCode && (
        <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
