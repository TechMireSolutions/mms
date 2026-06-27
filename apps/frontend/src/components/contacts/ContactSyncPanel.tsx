import React, { useState, useRef, useCallback } from "react";
import {
  Upload, Download, CheckCircle2, FileText,
  RefreshCw, Info, Smartphone, Globe, Link2, Unlink,
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
} from '@/hooks/useContacts';
import { useTranslation } from "@/hooks/useTranslation";
import { Contact, normalizeToE164, parsePhoneNumber } from "@mms/shared";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { isApiError } from "@/lib/apiClient";
import { queryClientInstance } from "@/lib/query-client";
import { CONTACTS_GOOGLE_SYNC_QUERY_KEY } from "@/hooks/useContacts";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";

/**
 * Parses a raw vCard (.vcf) formatted string into an array of normalized contact objects.
 * @param text The raw vCard content.
 * @param mobileLabel Label to use for phone entries.
 * @param personalLabel Label to use for email entries.
 * @returns Array of parsed contact objects.
 */
function parseVCard(text: string, mobileLabel: string, personalLabel: string, defaultPhoneCountryCode: string): Contact[] {
  const contacts: Contact[] = [];
  const cards = text.split(/BEGIN:VCARD/i).filter((c) => c.trim());
  for (const card of cards) {
    const get = (key: string): string => {
      const re = new RegExp(`^${key}[^:]*:(.*)$`, "im");
      const m = card.match(re);
      return m ? m[1].trim() : "";
    };
    const name = get("FN");
    if (!name) continue;
    const nameParts = name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");
    const phone = (card.match(/^TEL[^:]*:(.+)$/im) || [])[1]?.trim() || "";
    const parsedRaw = parsePhoneNumber(phone, defaultPhoneCountryCode);
    const e164 = normalizeToE164(parsedRaw.countryCode, parsedRaw.number);
    const parsed = parsePhoneNumber(e164, parsedRaw.countryCode);
    const email = (card.match(/^EMAIL[^:]*:(.+)$/im) || [])[1]?.trim() || "";
    const org = get("ORG").split(";")[0];
    const title = get("TITLE");
    const note = get("NOTE");
    const bday = get("BDAY");
    const contact: Contact = {
      id: Date.now() + Math.random(),
      name,
      firstName,
      lastName,
      phones: phone ? [{ label: mobileLabel, countryCode: parsed.countryCode, number: parsed.number }] : [],
      emails: email ? [{ label: personalLabel, address: email }] : [],
      employer: org || "",
      designation: title || "",
      notes: note || "",
      addresses: [],
      socials: [],
      emergencyContacts: [],
      createdAt: new Date().toISOString().slice(0, 10),
    };
    if (bday) {
      const clean = bday.replace(/[^0-9]/g, "");
      if (clean.length === 8) {
        contact.dob = `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
      }
    }
    contacts.push(contact);
  }
  return contacts;
}

/**
 * Converts a contact object into a raw vCard (.vcf) formatted string.
 * @param contact The contact object to convert.
 * @returns The formatted vCard string.
 */
function toVCard(contact: Contact): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${contact.name || ""}`,
    `N:${contact.lastName || ""};${contact.firstName || ""};;;`,
  ];
  (contact.phones || []).forEach((p) => lines.push(`TEL;TYPE=${p.label?.toUpperCase() || "CELL"}:${p.number}`));
  (contact.emails || []).forEach((e) => lines.push(`EMAIL;TYPE=${e.label?.toUpperCase() || "INTERNET"}:${e.address}`));
  if (contact.employer) lines.push(`ORG:${contact.employer}`);
  if (contact.designation) lines.push(`TITLE:${contact.designation}`);
  if (contact.notes) lines.push(`NOTE:${contact.notes}`);
  if (contact.dob) lines.push(`BDAY:${contact.dob.replace(/-/g, "")}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

const GOOGLE_STORAGE_KEY = "mms_google_contacts_config";

interface GoogleOauthConfig {
  clientId?: string;
  clientSecret?: string;
}

interface LegacyGoogleOauthConfig extends GoogleOauthConfig {
  accessToken?: string;
  refreshToken?: string;
}

function readLegacyGoogleConfig(): LegacyGoogleOauthConfig {
  try {
    let raw = localStorage.getItem(GOOGLE_STORAGE_KEY);
    if (!raw) raw = localStorage.getItem("madrasa_google_contacts_config");
    return raw ? (JSON.parse(raw) as LegacyGoogleOauthConfig) : {};
  } catch {
    return {};
  }
}

function clearLegacyGoogleConfig(): void {
  try {
    localStorage.removeItem(GOOGLE_STORAGE_KEY);
    localStorage.removeItem("madrasa_google_contacts_config");
  } catch {
    /* ignore */
  }
}

interface GoogleContactsPanelProps {
  contacts: Contact[];
  onImport: (contacts: Contact[]) => void;
  canWrite?: boolean;
}

/**
 * GoogleContactsPanel component to configure and run Google Contacts synchronization.
 */
function GoogleContactsPanel({ onImport, canWrite = true }: Omit<GoogleContactsPanelProps, 'contacts'>): React.JSX.Element {
  const { t } = useTranslation();
  const { data: serverConfig, isLoading: configLoading } = useContactGoogleSyncConfig();
  const { saveConfig, logSyncAudit, exchangeOAuth, runGoogleSync } = useContactGoogleSyncMutations();
  const [config, setConfig] = useState<GoogleOauthConfig>({});
  const [migrated, setMigrated] = useState(false);

  React.useEffect(() => {
    if (configLoading || migrated) return;
    const legacy = readLegacyGoogleConfig();
    if (legacy.clientId || legacy.accessToken) {
      void saveConfig.mutateAsync(legacy).finally(() => {
        clearLegacyGoogleConfig();
        setMigrated(true);
      });
      return;
    }
    setMigrated(true);
  }, [configLoading, migrated, saveConfig]);

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
  const handleSaveCredentials = (): void => {
    if (!form.clientId.trim() || !form.clientSecret.trim()) {
      setError(t('contacts.sync.clientIdRequired'));
      return;
    }
    const cfg: GoogleOauthConfig = { ...config, clientId: form.clientId.trim(), clientSecret: form.clientSecret.trim() };
    setConfig(cfg);
    void saveConfig.mutateAsync(cfg).then(() => {
      void logSyncAudit.mutateAsync({ action: 'credentials_saved' });
    });
    setShowSetup(false);
    setError("");
  };
  const handleConnect = (): void => {
    if (!config.clientId) return;
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
      if (!code.trim() || !isConfigured) return;
      setExchanging(true);
      setError("");
      try {
        const redirectUri = `${window.location.origin}/contacts`;
        const { config: next } = await exchangeOAuth.mutateAsync({ code: code.trim(), redirectUri });
        setConfig((prev) => ({
          ...prev,
          clientId: next.clientId ?? prev.clientId,
        }));
        setShowAuthCode(false);
        setAuthCode("");
        setError("");
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setError(t('contacts.sync.tokenExchangeFailed', { message }));
      } finally {
        setExchanging(false);
      }
    },
    [exchangeOAuth, isConfigured, t],
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
    if (configLoading || !isConfigured) return;
    const pending = takeGoogleContactsOAuthCode();
    if (!pending) return;
    setAuthCode(pending);
    setShowAuthCode(true);
    void exchangeOAuthCode(pending);
  }, [configLoading, isConfigured, exchangeOAuthCode]);
  const handleSync = async (): Promise<void> => {
    if (!isConnected) return;
    setSyncing(true);
    setSyncResult(null);
    setError("");
    try {
      const result = await runGoogleSync.mutateAsync();
      onImport(result.contacts);
      setSyncResult({ total: result.total, imported: result.imported, skipped: result.skipped });
    } catch (e) {
      if (isApiError(e) && e.type === 'session_expired') {
        await queryClientInstance.invalidateQueries({ queryKey: CONTACTS_GOOGLE_SYNC_QUERY_KEY });
        setError(t('contacts.sync.sessionExpired'));
        return;
      }
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = (): void => {
    const cfg: GoogleOauthConfig = { clientId: config.clientId, clientSecret: config.clientSecret };
    setConfig(cfg);
    void saveConfig.mutateAsync({ clientId: config.clientId, clearTokens: true }).then(() => {
      void logSyncAudit.mutateAsync({ action: 'disconnected' });
      void queryClientInstance.invalidateQueries({ queryKey: CONTACTS_GOOGLE_SYNC_QUERY_KEY });
    });
    setSyncResult(null);
    setError("");
    setShowAuthCode(false);
    setAuthCode("");
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
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowSetup((v) => !v)}
          className="text-xs font-medium min-h-[44px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors shadow-none"
        >
          <Key className="w-3 h-3" />
          <span>{isConfigured ? t('contacts.sync.editCredentials') : t('contacts.sync.setup')}</span>
          {showSetup ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>
      </div>

      <div className="p-4 space-y-4 text-left">
        
        {!isConfigured && !showSetup && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-warning/10 border border-warning/30 text-xs text-warning">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-warning" />
            <div>
              <p className="font-semibold mb-1">{t('contacts.sync.oauthSetupTitle')}</p>
              <p className="text-warning/90">{t('contacts.sync.oauthSetupDesc')}</p>
            </div>
          </div>
        )}

        
        {showSetup && (
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

        
        {isConfigured && !isConnected && !showSetup && (
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
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
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
              <Button
                type="button"
                variant="outline"
                onClick={handleDisconnect}
                className="flex items-center gap-1 text-xs transition-colors border border-border bg-card rounded-lg px-2.5 min-h-[44px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive shadow-none"
              >
                <Unlink className="w-3 h-3" />
                <span>{t('contacts.sync.disconnect')}</span>
              </Button>
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

            <Button
              type="button"
              onClick={handleSync}
              disabled={syncing || !canWrite}
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
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

interface AppleContactsPanelProps {
  contacts: Contact[];
  onImport: (contacts: Contact[]) => void;
  canWrite?: boolean;
}

/**
 * AppleContactsPanel component to import and export vCard files.
 */
function AppleContactsPanel({ contacts, onImport, canWrite = true }: AppleContactsPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const { phoneLabels, emailLabels, defaultPhoneCountryCode } = useContactConfig();
  const mobileLabel = phoneLabels[0] || t('contacts.sync.mobileLabel');
  const personalLabel = emailLabels[0] || t('contacts.sync.personalLabel');
  const [previewList, setPreviewList] = useState<Contact[]>([]);
  const [importing, setImporting] = useState<boolean>(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target && typeof ev.target.result === "string") {
        setPreviewList(parseVCard(ev.target.result, mobileLabel, personalLabel, defaultPhoneCountryCode));
        setResult(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = (): void => {
    setImporting(true);
    const existingNames = new Set(contacts.map((c) => c.name?.toLowerCase().trim()));
    const fresh = previewList.filter((c) => !existingNames.has(c.name?.toLowerCase().trim()));
    onImport(fresh);
    setResult({ imported: fresh.length, skipped: previewList.length - fresh.length });
    setPreviewList([]);
    setImporting(false);
  };

  const handleExport = (): void => {
    const vcf = contacts.map(toVCard).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([vcf], { type: "text/vcard" }));
    a.download = "madrasa-contacts.vcf";
    a.click();
  };

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
          <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <span className="text-sm font-bold text-foreground">{t('contacts.sync.appleTitle')}</span>
        <span className="text-[10px] text-muted-foreground">{t('contacts.sync.vcardLabel')}</span>
      </div>
      <div className="p-4 space-y-4 text-left">
        
        <div className="rounded-lg bg-muted/30 border border-border p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">{t('contacts.sync.appleExportTitle')}</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>{t('contacts.sync.appleExportStep1')}</li>
            <li>{t('contacts.sync.appleExportStep2')}</li>
            <li>{t('contacts.sync.appleExportStep3')}</li>
            <li>{t('contacts.sync.appleExportStep4')}</li>
          </ol>
        </div>

        
        <input ref={fileRef} type="file" accept=".vcf,text/vcard" className="hidden" onChange={handleFile} />
        {previewList.length === 0 && !result && (
          <Button
            type="button"
            variant="outline"
            onClick={() => canWrite && fileRef.current?.click()}
            disabled={!canWrite}
            className="w-full flex flex-col items-center justify-center gap-2 py-7 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer bg-card disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card h-auto shadow-none"
          >
            <FileText className="w-7 h-7 opacity-40" />
            <span className="text-sm font-semibold text-foreground">{t('contacts.sync.uploadVcf')}</span>
            <span className="text-xs">{t('contacts.sync.dragDropBrowse')}</span>
          </Button>
        )}

        {previewList.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                {previewList.length} {t('contacts.sync.contactsFound')}
              </p>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPreviewList([])}
                className="text-xs min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors bg-transparent shadow-none"
              >
                {t('contacts.sync.clear')}
              </Button>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1 border border-border rounded-xl p-2 bg-card">
              {previewList.slice(0, 50).map((c, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-muted/50 text-sm">
                  <span className="font-medium text-foreground truncate">{c.name}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                    {c.phones?.[0]?.number || c.emails?.[0]?.address || ""}
                  </span>
                </div>
              ))}
              {previewList.length > 50 && (
                <p className="text-xs text-center text-muted-foreground py-1">
                  {t('contacts.sync.andMore', { count: previewList.length - 50 })}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleImport}
                disabled={importing || !canWrite}
                className="flex items-center gap-2 px-5 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors shadow-none"
              >
                {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>
                  {t('contacts.sync.importCount', { count: previewList.length })}
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPreviewList([]);
                  fileRef.current?.click();
                }}
                className="px-4 min-h-[44px] rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-card shadow-none"
              >
                {t('contacts.sync.chooseDifferentFile')}
              </Button>
            </div>
          </div>
        )}

        {result && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-success/10 border border-success/30 text-sm text-success">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-success" />
            <div>
              <p className="font-semibold">{t('contacts.sync.importComplete')}</p>
              <p className="text-xs text-success/90 mt-0.5">
                {t('contacts.sync.importedCount', { count: result.imported })}
                {result.skipped > 0 ? ` · ${t('contacts.sync.skippedCount', { count: result.skipped })}` : ""}
              </p>
            </div>
          </div>
        )}

        
        <div className="border-t border-border pt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t('contacts.sync.exportAppleHint')}</span>
          <Button
            type="button"
            variant="outline"
            onClick={handleExport}
            disabled={contacts.length === 0}
            className="flex items-center gap-1.5 px-3.5 min-h-[44px] rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50 transition-colors bg-card shadow-none"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {t('contacts.sync.exportVcf', { count: contacts.length })}
            </span>
          </Button>
        </div>
      </div>
    </section>
  );
}

interface ContactSyncPanelProps {
  contacts?: Contact[];
  onImport: (contacts: Contact[]) => void;
  canWrite?: boolean;
}

/**
 * ContactSyncPanel component for managing Google and Apple Contacts synchronization.
 */
export default function ContactSyncPanel({ contacts = [], onImport, canWrite = false }: ContactSyncPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="space-y-5 max-w-3xl text-left">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-info/10 border border-info/30 text-sm text-info">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-info" />
        <div>
          <h3 className="font-semibold">{t('contacts.sync.title')}</h3>
          <p className="text-xs mt-0.5 text-info/90">
            {t('contacts.sync.description')}
          </p>
        </div>
      </div>

      <GoogleContactsPanel onImport={onImport} canWrite={canWrite} />
      <AppleContactsPanel contacts={contacts} onImport={onImport} canWrite={canWrite} />
    </div>
  );
}
