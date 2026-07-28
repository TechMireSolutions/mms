import React, { useState, useCallback } from "react";
import {
  CheckCircle2,
  Globe, Link2, Unlink,
  Key, ExternalLink, AlertCircle, ChevronDown, ChevronUp,
  Users, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  GOOGLE_CONTACTS_OAUTH_MESSAGE,
  takeGoogleContactsOAuthCode,
} from '@/lib/contacts/googleContactsOAuth';
import {
  useContactGoogleSyncConfig,
  useContactGoogleSyncMutations,
  CONTACTS_GOOGLE_SYNC_QUERY_KEY,
} from '@/tenant/features/contacts/hooks/useContacts';
import { useTranslation } from "@/hooks/useTranslation";
import { type Contact, type ContactGoogleSyncConfigClient } from "@mms/shared";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { isApiError } from "@/lib/apiClient";
import { queryClientInstance } from "@/lib/queryClient";

export interface GoogleContactsPanelProps {
  onImport: (contacts: Contact[]) => void | Promise<void>;
  canWrite?: boolean;
}

/**
 * GoogleContactsPanel component to configure and run Google Contacts synchronization.
 */
export function GoogleContactsPanel({ onImport, canWrite = true }: GoogleContactsPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const { data: serverConfig, isLoading: configLoading } = useContactGoogleSyncConfig();
  const { saveConfig, logSyncAudit, exchangeOAuth, runGoogleSync } = useContactGoogleSyncMutations();
  const [config, setConfig] = useState<ContactGoogleSyncConfigClient>({});

  React.useEffect(() => {
    if (serverConfig) {
      setConfig({
        clientId: serverConfig.clientId,
      });
    }
  }, [serverConfig]);
  const [showSetup, setShowSetup] = useState<boolean>(false);
  const [form, setForm] = useState({ clientId: config.clientId || "", clientSecret: config.clientSecret || "" });
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<{ total: number; imported: number; skipped: number } | null>(null);
  const [error, setError] = useState<string>("");
  const [showAuthCode, setShowAuthCode] = useState<boolean>(false);
  const [authCode, setAuthCode] = useState<string>("");
  const [exchanging, setExchanging] = useState<boolean>(false);

  const isConfigured = !!(config.clientId && (config.clientSecret || serverConfig?.hasClientSecret));
  const isConnected = serverConfig?.isConnected ?? false;
  const handleSaveCredentials = async (): Promise<void> => {
    if (!canWrite) return;
    if (!form.clientId.trim() || !form.clientSecret.trim()) {
      setError(t('contacts.sync.clientIdRequired'));
      return;
    }
    const updatedConfig: ContactGoogleSyncConfigClient = { ...config, clientId: form.clientId.trim(), clientSecret: form.clientSecret.trim() };
    try {
      await saveConfig.mutateAsync(updatedConfig);
      setConfig(updatedConfig);
      setShowSetup(false);
      setError("");
      void logSyncAudit.mutateAsync({ action: 'credentials_saved' });
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    }
  };
  const handleConnect = (): void => {
    if (!canWrite || !config.clientId) return;
    const redirectUri = window.location.origin + "/contacts";
    const scope = encodeURIComponent("https://www.googleapis.com/auth/contacts.readonly");
    const state = encodeURIComponent(JSON.stringify({ source: "google_contacts" }));
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${scope}&access_type=offline&state=${state}&prompt=consent`;
    window.open(url, "_blank", "width=500,height=600");
    setError(t('contacts.sync.oauthRedirectHint'));
    setShowAuthCode(true);
  };

  const exchangeOAuthCode = useCallback(
    async (code: string): Promise<void> => {
      if (!canWrite || !code.trim() || !isConfigured) return;
      setExchanging(true);
      setError("");
      try {
        const redirectUri = `${window.location.origin}/contacts`;
        const { config: exchangedConfig } = await exchangeOAuth.mutateAsync({ code: code.trim(), redirectUri });
        setConfig((prev) => ({
          ...prev,
          clientId: exchangedConfig.clientId ?? prev.clientId,
        }));
        setShowAuthCode(false);
        setAuthCode("");
        setError("");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setError(t('contacts.sync.tokenExchangeFailed', { message }));
      } finally {
        setExchanging(false);
      }
    },
    [canWrite, exchangeOAuth, isConfigured, t],
  );

  const handleExchangeCode = async (): Promise<void> => {
    await exchangeOAuthCode(authCode);
  };

  React.useEffect(() => {
    const onMessage = (event: MessageEvent): void => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== GOOGLE_CONTACTS_OAUTH_MESSAGE || typeof event.data.code !== 'string') return;
      setAuthCode(event.data.code);
      setShowAuthCode(true);
      void exchangeOAuthCode(event.data.code);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [exchangeOAuthCode]);

  React.useEffect(() => {
    if (!canWrite || configLoading || !isConfigured) return;
    const pending = takeGoogleContactsOAuthCode();
    if (!pending) return;
    setAuthCode(pending);
    setShowAuthCode(true);
    void exchangeOAuthCode(pending);
  }, [canWrite, configLoading, isConfigured, exchangeOAuthCode]);
  const handleSync = async (): Promise<void> => {
    if (!canWrite || !isConnected) return;
    setSyncing(true);
    setSyncResult(null);
    setError("");
    try {
      const result = await runGoogleSync.mutateAsync();
      await onImport(result.contacts);
      setSyncResult({ total: result.total, imported: result.imported, skipped: result.skipped });
    } catch (error) {
      if (isApiError(error) && error.type === 'session_expired') {
        await queryClientInstance.invalidateQueries({ queryKey: CONTACTS_GOOGLE_SYNC_QUERY_KEY });
        setError(t('contacts.sync.sessionExpired'));
        return;
      }
      const message = error instanceof Error ? error.message : String(error);
      setError(message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async (): Promise<void> => {
    if (!canWrite) return;
    const disconnectedConfig: ContactGoogleSyncConfigClient = { clientId: config.clientId, clientSecret: config.clientSecret };
    try {
      await saveConfig.mutateAsync({ clientId: config.clientId, clearTokens: true });
      setConfig(disconnectedConfig);
      void logSyncAudit.mutateAsync({ action: 'disconnected' });
      await queryClientInstance.invalidateQueries({ queryKey: CONTACTS_GOOGLE_SYNC_QUERY_KEY });
      setSyncResult(null);
      setError("");
      setShowAuthCode(false);
      setAuthCode("");
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      
      <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <span className="text-sm font-bold text-foreground">{t('contacts.sync.googleTitle')}</span>
          {isConnected && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-success/10 text-success border border-success/30">
              {t('contacts.sync.connected')}
            </span>
          )}
        </div>
        {canWrite && <Button
          type="button"
          variant="ghost"
          onClick={() => setShowSetup((v) => !v)}
          className="text-xs font-medium min-h-[44px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors shadow-none"
        >
          <Key className="w-3 h-3" />
          <span>{isConfigured ? t('contacts.sync.editCredentials') : t('contacts.sync.setup')}</span>
          {showSetup ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>}
      </div>

      <div className="p-4 space-y-4 text-start">
        
        {!isConfigured && !showSetup && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-warning/10 border border-warning/30 text-xs text-warning">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-warning" />
            <div>
              <p className="font-semibold mb-1">{t('contacts.sync.oauthSetupTitle')}</p>
              <p className="text-warning/90">{t('contacts.sync.oauthSetupDesc')}</p>
            </div>
          </div>
        )}

        
        {canWrite && showSetup && (
          <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">{t('contacts.sync.oauthHeader')}</h4>
            <div>
              <label className={FORM_LABEL} htmlFor="clientId">{t('contacts.sync.clientIdLabel')}</label>
              <Input
                id="clientId"
                value={form.clientId}
                onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                placeholder="xxxx.apps.googleusercontent.com"
              />
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="clientSecret">{t('contacts.sync.clientSecretLabel')}</label>
              <Input
                id="clientSecret"
                type="password"
                value={form.clientSecret}
                onChange={(e) => setForm((f) => ({ ...f, clientSecret: e.target.value }))}
                placeholder="GOCSPX-…"
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
                onClick={handleSaveCredentials}
                className="px-4 min-h-[44px] rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-none"
              >
                {t('contacts.sync.saveCredentials')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowSetup(false);
                  setError("");
                }}
                className="px-4 min-h-[44px] rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-card shadow-none"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}

        
        {isConfigured && !isConnected && !showSetup && canWrite && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t('contacts.sync.credentialsSaved')}</p>
            <Button
              type="button"
              variant="outline"
              onClick={handleConnect}
              className="w-full flex items-center gap-2 px-4 min-h-[44px] rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted transition-colors shadow-none justify-start"
            >
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span>{t('contacts.sync.connectGoogle')}</span>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ms-auto" />
            </Button>

            {showAuthCode && (
              <div className="space-y-2 p-3 rounded-xl bg-info/10 border border-info/30 text-info">
                <label className={FORM_LABEL} htmlFor="authCode">
                  {t('contacts.sync.pasteAuthCode')}
                </label>
                <Input
                  id="authCode"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  placeholder={t('contacts.sync.pasteAuthCodePlaceholder')}
                />
                <Button
                  type="button"
                  onClick={handleExchangeCode}
                  disabled={!authCode.trim() || exchanging}
                  className="flex items-center gap-2 px-4 min-h-[44px] rounded-lg bg-info text-info-foreground text-xs font-bold hover:bg-info/90 disabled:opacity-60 transition-colors border border-transparent shadow-none"
                >
                  {exchanging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                  <span>{t('contacts.sync.confirmAuth')}</span>
                </Button>
              </div>
            )}

            {error && !showAuthCode && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>
        )}

        
        {isConnected && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/30 text-success">
              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-success">{t('contacts.sync.googleConnectedTitle')}</p>
                <p className="text-xs text-success/90">{t('contacts.sync.googleConnectedDesc')}</p>
              </div>
              {canWrite && <Button
                type="button"
                variant="outline"
                onClick={handleDisconnect}
                className="flex items-center gap-1 text-xs transition-colors border border-border bg-card rounded-lg px-2.5 min-h-[44px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive shadow-none"
              >
                <Unlink className="w-3 h-3" />
                <span>{t('contacts.sync.disconnect')}</span>
              </Button>}
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
                    {t('contacts.sync.syncCompleteTitle', { total: syncResult.total })}
                  </p>
                  <p className="text-success/90 mt-0.5">
                    {t('contacts.sync.syncCompleteDesc', {
                      imported: syncResult.imported,
                      skipped: syncResult.skipped,
                    })}
                  </p>
                </div>
              </div>
            )}

            {canWrite && <Button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-5 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors shadow-none"
            >
              {syncing ? (
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
            </Button>}
          </div>
        )}
      </div>
    </section>
  );
}
