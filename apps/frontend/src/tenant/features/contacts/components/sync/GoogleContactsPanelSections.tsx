import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Globe,
  Link2,
  Loader2,
  Unlink,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FORM_LABEL } from "@/components/ui/formStyles";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

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
}) {
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
          placeholder="xxxx.apps.googleusercontent.com"
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
          placeholder="GOCSPX-..."
        />
      </div>
      {error && (
        <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={onSave}
          className="px-4 min-h-[44px] rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-none"
        >
          {t("contacts.sync.saveCredentials")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="px-4 min-h-[44px] rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-card shadow-none"
        >
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
}

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
        className="w-full flex items-center gap-2 px-4 min-h-[44px] rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted transition-colors shadow-none justify-start"
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
            className="flex items-center gap-2 px-4 min-h-[44px] rounded-lg bg-info text-info-foreground text-xs font-bold hover:bg-info/90 disabled:opacity-60 transition-colors border border-transparent shadow-none"
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

export function GoogleContactsConnectedState({
  canWrite,
  error,
  syncResult,
  syncing,
  onDisconnect,
  onSync,
  t,
}: {
  canWrite: boolean;
  error: string;
  syncResult: { total: number; imported: number; skipped: number } | null;
  syncing: boolean;
  onDisconnect: () => void;
  onSync: () => void;
  t: TranslationFunction;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/30 text-success">
        <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-success">{t("contacts.sync.googleConnectedTitle")}</p>
          <p className="text-xs text-success/90">{t("contacts.sync.googleConnectedDesc")}</p>
        </div>
        {canWrite && (
          <Button
            type="button"
            variant="outline"
            onClick={onDisconnect}
            className="flex items-center gap-1 text-xs transition-colors border border-border bg-card rounded-lg px-2.5 min-h-[44px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive shadow-none"
          >
            <Unlink className="w-3 h-3" />
            <span>{t("contacts.sync.disconnect")}</span>
          </Button>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {syncResult && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-success/10 border border-success/30 text-xs text-success">
          <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">
              {t("contacts.sync.syncCompleteTitle", { total: syncResult.total })}
            </p>
            <p className="text-success/90 mt-0.5">
              {t("contacts.sync.syncCompleteDesc", {
                imported: syncResult.imported,
                skipped: syncResult.skipped,
              })}
            </p>
          </div>
        </div>
      )}

      {canWrite && (
        <Button
          type="button"
          onClick={onSync}
          disabled={syncing}
          className="flex items-center gap-2 px-5 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors shadow-none"
        >
          {syncing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t("contacts.sync.syncing")}</span>
            </>
          ) : (
            <>
              <Users className="w-4 h-4" />
              <span>{t("contacts.sync.syncGoogle")}</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
}

export function GoogleContactsSetupHint({ t }: { t: TranslationFunction }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-warning/10 border border-warning/30 text-xs text-warning">
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-warning" />
      <div>
        <p className="font-semibold mb-1">{t("contacts.sync.oauthSetupTitle")}</p>
        <p className="text-warning/90">{t("contacts.sync.oauthSetupDesc")}</p>
      </div>
    </div>
  );
}
