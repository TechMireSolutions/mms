import React from "react";
import {
  CheckCircle2,
  Globe, Link2, Unlink,
  Key, ExternalLink, AlertCircle, ChevronDown, ChevronUp,
  Users, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { type Contact } from "@mms/shared";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { useGoogleContactsSync } from "@/tenant/features/contacts/hooks/useGoogleContactsSync";

export interface GoogleContactsPanelProps {
  onImport: (contacts: Contact[]) => void | Promise<void>;
  canWrite?: boolean;
}

/**
 * GoogleContactsPanel component to configure and run Google Contacts synchronization.
 */
export function GoogleContactsPanel({ onImport, canWrite = true }: GoogleContactsPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const sync = useGoogleContactsSync({ onImport, canWrite });

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <span className="text-sm font-bold text-foreground">{t('contacts.sync.googleTitle')}</span>
          {sync.isConnected && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-success/10 text-success border border-success/30">
              {t('contacts.sync.connected')}
            </span>
          )}
        </div>
        {canWrite && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => sync.setShowSetup((v) => !v)}
            className="text-xs font-medium min-h-[44px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors shadow-none"
          >
            <Key className="w-3 h-3" />
            <span>{sync.isConfigured ? t('contacts.sync.editCredentials') : t('contacts.sync.setup')}</span>
            {sync.showSetup ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        )}
      </div>

      <div className="p-4 space-y-4 text-start">
        {!sync.isConfigured && !sync.showSetup && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-warning/10 border border-warning/30 text-xs text-warning">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-warning" />
            <div>
              <p className="font-semibold mb-1">{t('contacts.sync.oauthSetupTitle')}</p>
              <p className="text-warning/90">{t('contacts.sync.oauthSetupDesc')}</p>
            </div>
          </div>
        )}

        {canWrite && sync.showSetup && (
          <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">{t('contacts.sync.oauthHeader')}</h4>
            <div>
              <label className={FORM_LABEL} htmlFor="clientId">{t('contacts.sync.clientIdLabel')}</label>
              <Input
                id="clientId"
                value={sync.form.clientId}
                onChange={(e) => sync.setForm((f) => ({ ...f, clientId: e.target.value }))}
                placeholder="xxxx.apps.googleusercontent.com"
              />
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="clientSecret">{t('contacts.sync.clientSecretLabel')}</label>
              <Input
                id="clientSecret"
                type="password"
                value={sync.form.clientSecret}
                onChange={(e) => sync.setForm((f) => ({ ...f, clientSecret: e.target.value }))}
                placeholder="GOCSPX-…"
              />
            </div>
            {sync.error && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
                {sync.error}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => void sync.handleSaveCredentials()}
                className="px-4 min-h-[44px] rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-none"
              >
                {t('contacts.sync.saveCredentials')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  sync.setShowSetup(false);
                  sync.setError("");
                }}
                className="px-4 min-h-[44px] rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-card shadow-none"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}

        {sync.isConfigured && !sync.isConnected && !sync.showSetup && canWrite && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t('contacts.sync.credentialsSaved')}</p>
            <Button
              type="button"
              variant="outline"
              onClick={sync.handleConnect}
              className="w-full flex items-center gap-2 px-4 min-h-[44px] rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted transition-colors shadow-none justify-start"
            >
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span>{t('contacts.sync.connectGoogle')}</span>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ms-auto" />
            </Button>

            {sync.showAuthCode && (
              <div className="space-y-2 p-3 rounded-xl bg-info/10 border border-info/30 text-info">
                <label className={FORM_LABEL} htmlFor="authCode">
                  {t('contacts.sync.pasteAuthCode')}
                </label>
                <Input
                  id="authCode"
                  value={sync.authCode}
                  onChange={(e) => sync.setAuthCode(e.target.value)}
                  placeholder={t('contacts.sync.pasteAuthCodePlaceholder')}
                />
                <Button
                  type="button"
                  onClick={() => void sync.handleExchangeCode()}
                  disabled={!sync.authCode.trim() || sync.exchanging}
                  className="flex items-center gap-2 px-4 min-h-[44px] rounded-lg bg-info text-info-foreground text-xs font-bold hover:bg-info/90 disabled:opacity-60 transition-colors border border-transparent shadow-none"
                >
                  {sync.exchanging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                  <span>{t('contacts.sync.confirmAuth')}</span>
                </Button>
              </div>
            )}

            {sync.error && !sync.showAuthCode && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
                {sync.error}
              </p>
            )}
          </div>
        )}

        {sync.isConnected && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/30 text-success">
              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-success">{t('contacts.sync.googleConnectedTitle')}</p>
                <p className="text-xs text-success/90">{t('contacts.sync.googleConnectedDesc')}</p>
              </div>
              {canWrite && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void sync.handleDisconnect()}
                  className="flex items-center gap-1 text-xs transition-colors border border-border bg-card rounded-lg px-2.5 min-h-[44px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive shadow-none"
                >
                  <Unlink className="w-3 h-3" />
                  <span>{t('contacts.sync.disconnect')}</span>
                </Button>
              )}
            </div>

            {sync.error && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
                {sync.error}
              </p>
            )}

            {sync.syncResult && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-success/10 border border-success/30 text-xs text-success">
                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">
                    {t('contacts.sync.syncCompleteTitle', { total: sync.syncResult.total })}
                  </p>
                  <p className="text-success/90 mt-0.5">
                    {t('contacts.sync.syncCompleteDesc', {
                      imported: sync.syncResult.imported,
                      skipped: sync.syncResult.skipped,
                    })}
                  </p>
                </div>
              </div>
            )}

            {canWrite && (
              <Button
                type="button"
                onClick={() => void sync.handleSync()}
                disabled={sync.syncing}
                className="flex items-center gap-2 px-5 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors shadow-none"
              >
                {sync.syncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('contacts.sync.syncing')}</span>
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    <span>{t('contacts.sync.syncGoogle')}</span>
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
