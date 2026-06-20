import React, { useState, useRef } from "react";
import {
  Upload, Download, CheckCircle2, FileText,
  RefreshCw, Info, Smartphone, Globe, Link2, Unlink,
  Key, ExternalLink, AlertCircle, ChevronDown, ChevronUp,
  Users, Loader2,
} from "lucide-react";

import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import { normalizeToE164, parsePhoneNumber, Contact } from "@mms/shared";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";


// ── vCard helpers ──────────────────────────────────────────────────────────────

/**
 * Parses a raw vCard (.vcf) formatted string into an array of normalized contact objects.
 * @param text The raw vCard content.
 * @param mobileLabel Label to use for phone entries.
 * @param personalLabel Label to use for email entries.
 * @returns Array of parsed contact objects.
 */
function parseVCard(text: string, mobileLabel: string, personalLabel: string): Contact[] {
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
    const parsedRaw = parsePhoneNumber(phone, "+92");
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

// ── Google Contacts OAuth Setup Panel ─────────────────────────────────────────

const GOOGLE_STORAGE_KEY = "mms_google_contacts_config";

interface GoogleOauthConfig {
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
}

/**
 * Loads the stored Google OAuth config from localStorage.
 * @returns The parsed Google OAuth config object.
 */
function loadGoogleConfig(): GoogleOauthConfig {
  try {
    let raw = localStorage.getItem(GOOGLE_STORAGE_KEY);
    if (!raw) {
      const legacy = localStorage.getItem("madrasa_google_contacts_config");
      if (legacy) {
        raw = legacy;
        localStorage.setItem(GOOGLE_STORAGE_KEY, legacy);
        try {
          localStorage.removeItem("madrasa_google_contacts_config");
        } catch (err) {
          console.warn("[ContactSyncPanel] Failed to remove legacy Google config key:", err);
        }
      }
    }
    return JSON.parse(raw || "{}") as GoogleOauthConfig;
  } catch {
    return {};
  }
}

/**
 * Saves the Google OAuth config to localStorage.
 * @param cfg The Google OAuth config object.
 */
function saveGoogleConfig(cfg: GoogleOauthConfig): void {
  localStorage.setItem(GOOGLE_STORAGE_KEY, JSON.stringify(cfg));
}

interface GoogleContactsPanelProps {
  contacts: Contact[];
  onImport: (contacts: Contact[]) => void;
  canWrite?: boolean;
}

interface GoogleTokenResponse {
  access_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleConnection {
  names?: Array<{ displayName?: string; givenName?: string; familyName?: string }>;
  phoneNumbers?: Array<{ value?: string }>;
  emailAddresses?: Array<{ value?: string }>;
  organizations?: Array<{ name?: string; title?: string }>;
  birthdays?: Array<{ date?: { year?: number; month?: number; day?: number } }>;
  biographies?: Array<{ value?: string }>;
  addresses?: Array<{ streetAddress?: string; city?: string; region?: string; country?: string }>;
}

interface GooglePeopleResponse {
  connections?: GoogleConnection[];
  nextPageToken?: string;
  error?: {
    message?: string;
  };
}

/**
 * GoogleContactsPanel component to configure and run Google Contacts synchronization.
 */
function GoogleContactsPanel({ contacts, onImport, canWrite = true }: GoogleContactsPanelProps): React.JSX.Element {
  const { uiStrings } = useContactConfig();
  const [config, setConfig] = useState<GoogleOauthConfig>(() => loadGoogleConfig());
  const [showSetup, setShowSetup] = useState<boolean>(false);
  const [form, setForm] = useState({ clientId: config.clientId || "", clientSecret: config.clientSecret || "" });
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<{ total: number; imported: number; skipped: number } | null>(null);
  const [error, setError] = useState<string>("");
  const [showAuthCode, setShowAuthCode] = useState<boolean>(false);
  const [authCode, setAuthCode] = useState<string>("");
  const [exchanging, setExchanging] = useState<boolean>(false);

  const isConfigured = !!(config.clientId && config.clientSecret);
  const isConnected = !!config.accessToken;

  // Step 1: Save credentials
  const handleSaveCredentials = (): void => {
    if (!form.clientId.trim() || !form.clientSecret.trim()) {
      setError(uiStrings.clientIdRequiredMsg || "Both Client ID and Client Secret are required.");
      return;
    }
    const cfg: GoogleOauthConfig = { ...config, clientId: form.clientId.trim(), clientSecret: form.clientSecret.trim() };
    setConfig(cfg);
    saveGoogleConfig(cfg);
    setShowSetup(false);
    setError("");
  };

  // Step 2: Open Google OAuth consent screen
  const handleConnect = (): void => {
    if (!config.clientId) return;
    const redirectUri = window.location.origin + "/contacts";
    const scope = encodeURIComponent("https://www.googleapis.com/auth/contacts.readonly");
    const state = encodeURIComponent(JSON.stringify({ source: "google_contacts" }));
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${scope}&access_type=offline&state=${state}&prompt=consent`;
    window.open(url, "_blank", "width=500,height=600");
    // Inform user to paste the auth code
    setError(uiStrings.oauthRedirectInstruction || "After authorizing, Google will redirect to your app. Copy the 'code' parameter from the URL and paste it below.");
    setShowAuthCode(true);
  };

  // Step 3: Exchange auth code for access token (via backend/OAuth API)
  const handleExchangeCode = async (): Promise<void> => {
    if (!authCode.trim() || !config.clientId || !config.clientSecret) return;
    setExchanging(true);
    setError("");
    try {
      const redirectUri = window.location.origin + "/contacts";
      const params = new URLSearchParams({
        code: authCode.trim(),
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      });
      const res = await fetch("https://oauth2.googleapis.com/token", { method: "POST", body: params });
      const data = (await res.json()) as GoogleTokenResponse;
      if (data.error) throw new Error(data.error_description || data.error);
      const cfg: GoogleOauthConfig = { ...config, accessToken: data.access_token, refreshToken: data.refresh_token };
      setConfig(cfg);
      saveGoogleConfig(cfg);
      setShowAuthCode(false);
      setAuthCode("");
      setError("");
    } catch (e) {
      const err = e as Error;
      setError((uiStrings.tokenExchangeFailed || "Token exchange failed: ") + err.message);
    } finally {
      setExchanging(false);
    }
  };

  // Step 4: Fetch contacts from Google People API
  const handleSync = async (): Promise<void> => {
    if (!config.accessToken) return;
    setSyncing(true);
    setSyncResult(null);
    setError("");
    try {
      const allPeople: Contact[] = [];
      let pageToken = "";
      do {
        const url = `https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,organizations,birthdays,addresses,biographies&pageSize=1000${
          pageToken ? `&pageToken=${pageToken}` : ""
        }`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${config.accessToken}` } });
        if (res.status === 401) {
          // Token expired
          const cfg = { ...config };
          delete cfg.accessToken;
          delete cfg.refreshToken;
          setConfig(cfg);
          saveGoogleConfig(cfg);
          throw new Error(uiStrings.sessionExpiredMsg || "Session expired. Please reconnect your Google account.");
        }
        const data = (await res.json()) as GooglePeopleResponse;
        if (data.error) throw new Error(data.error.message);
        (data.connections || []).forEach((p) => {
          const nameObj = p.names?.[0];
          const name = nameObj?.displayName || "";
          if (!name) return;
          const phone = p.phoneNumbers?.[0]?.value || "";
          const parsedRaw = parsePhoneNumber(phone, "+92");
          const e164 = normalizeToE164(parsedRaw.countryCode, parsedRaw.number);
          const parsed = parsePhoneNumber(e164, parsedRaw.countryCode);
          const email = p.emailAddresses?.[0]?.value || "";
          const org = p.organizations?.[0]?.name || "";
          const title = p.organizations?.[0]?.title || "";
          const bday = p.birthdays?.[0]?.date;
          const note = p.biographies?.[0]?.value || "";
          const addr = p.addresses?.[0];
          const contact: Contact = {
            id: Date.now() + Math.random(),
            name,
            firstName: nameObj?.givenName || name.split(" ")[0],
            lastName: nameObj?.familyName || name.split(" ").slice(1).join(" "),
            phones: phone ? [{ label: uiStrings.mobileLabel, countryCode: parsed.countryCode, number: parsed.number }] : [],
            emails: email ? [{ label: uiStrings.personalLabel, address: email }] : [],
            employer: org,
            designation: title,
            notes: note,
            addresses: addr
              ? [
                  {
                    line1: addr.streetAddress || "",
                    city: addr.city || "",
                    state: addr.region || "",
                    country: addr.country || "",
                  },
                ]
              : [],
            socials: [],
            emergencyContacts: [],
            createdAt: new Date().toISOString().slice(0, 10),
          };
          if (bday?.year && bday?.month && bday?.day) {
            contact.dob = `${bday.year}-${String(bday.month).padStart(2, "0")}-${String(bday.day).padStart(2, "0")}`;
          }
          allPeople.push(contact);
        });
        pageToken = data.nextPageToken || "";
      } while (pageToken);

      const existingNames = new Set(contacts.map((c) => c.name?.toLowerCase().trim()));
      const fresh = allPeople.filter((c) => !existingNames.has(c.name?.toLowerCase().trim()));
      const dups = allPeople.length - fresh.length;
      onImport(fresh);
      setSyncResult({ total: allPeople.length, imported: fresh.length, skipped: dups });
    } catch (e) {
      const err = e as Error;
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = (): void => {
    const cfg: GoogleOauthConfig = { clientId: config.clientId, clientSecret: config.clientSecret };
    setConfig(cfg);
    saveGoogleConfig(cfg);
    setSyncResult(null);
    setError("");
    setShowAuthCode(false);
    setAuthCode("");
  };

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <span className="text-sm font-bold text-foreground">{uiStrings.googleContacts}</span>
          {isConnected && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-success/10 text-success border border-success/30">
              {uiStrings.connectedLabel}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowSetup((v) => !v)}
          className="text-xs font-medium min-h-[44px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <Key className="w-3 h-3" />
          <span>{isConfigured ? uiStrings.editCredentials : uiStrings.setup}</span>
          {showSetup ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      <div className="p-4 space-y-4 text-left">
        {/* Setup instructions */}
        {!isConfigured && !showSetup && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-warning/10 border border-warning/30 text-xs text-warning">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-warning" />
            <div>
              <p className="font-semibold mb-1">{uiStrings.oauthAppSetupMsg}</p>
              <p className="text-warning/90">{uiStrings.googleCloudInstructions}</p>
            </div>
          </div>
        )}

        {/* Credentials form */}
        {showSetup && (
          <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">{uiStrings.googleOauthCredentialsHeader}</h4>
            <div>
              <label className={FORM_LABEL} htmlFor="clientId">{uiStrings.clientIdLabel}</label>
              <input
                id="clientId"
                className={FORM_INPUT}
                value={form.clientId}
                onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                placeholder="xxxx.apps.googleusercontent.com"
              />
            </div>
            <div>
              <label className={FORM_LABEL} htmlFor="clientSecret">{uiStrings.clientSecretLabel}</label>
              <input
                id="clientSecret"
                type="password"
                className={FORM_INPUT}
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
              <button
                type="button"
                onClick={handleSaveCredentials}
                className="px-4 min-h-[44px] rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
              >
                {uiStrings.saveCredentials}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSetup(false);
                  setError("");
                }}
                className="px-4 min-h-[44px] rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-card"
              >
                {uiStrings.cancel}
              </button>
            </div>
          </div>
        )}

        {/* Connect / Auth code exchange */}
        {isConfigured && !isConnected && !showSetup && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{uiStrings.googleCredentialsSavedMsg}</p>
            <button
              type="button"
              onClick={handleConnect}
              className="w-full flex items-center gap-2 px-4 min-h-[44px] rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted transition-colors shadow-sm"
            >
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span>{uiStrings.connectGoogleAccountBtn}</span>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
            </button>

            {showAuthCode && (
              <div className="space-y-2 p-3 rounded-xl bg-info/10 border border-info/30 text-info">
                <label className={FORM_LABEL} htmlFor="authCode">
                  {uiStrings.pasteAuthCodeLabel}
                </label>
                <input
                  id="authCode"
                  className={FORM_INPUT}
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  placeholder={uiStrings.pasteAuthCodePlaceholder}
                />
                <button
                  type="button"
                  onClick={handleExchangeCode}
                  disabled={!authCode.trim() || exchanging}
                  className="flex items-center gap-2 px-4 min-h-[44px] rounded-lg bg-info text-info-foreground text-xs font-bold hover:bg-info/90 disabled:opacity-60 transition-colors border border-transparent"
                >
                  {exchanging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                  <span>{uiStrings.confirmAuthBtn}</span>
                </button>
              </div>
            )}

            {error && !showAuthCode && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>
        )}

        {/* Connected state — sync */}
        {isConnected && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/30 text-success">
              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-success">{uiStrings.googleAccountConnectedTitle}</p>
                <p className="text-xs text-success/90">{uiStrings.googleAccountConnectedDesc}</p>
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                className={`flex items-center gap-1 text-xs transition-colors border border-border bg-card rounded-lg px-2.5 min-h-[44px] ${uiStrings?.deleteActionClass || "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"}`}
              >
                <Unlink className="w-3 h-3" />
                <span>{uiStrings.disconnectBtn}</span>
              </button>
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
                    {(uiStrings.syncCompleteTitle || "Sync complete — {total} contacts fetched")
                      .replace("{total}", String(syncResult.total))}
                  </p>
                  <p className="text-success/90 mt-0.5">
                    {(uiStrings.syncCompleteDesc || "{imported} imported · {skipped} already existed")
                      .replace("{imported}", String(syncResult.imported))
                      .replace("{skipped}", String(syncResult.skipped))}
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleSync}
              disabled={syncing || !canWrite}
              className="flex items-center gap-2 px-5 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{uiStrings.syncing}</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  <span>{uiStrings.syncGoogleContactsBtn}</span>
                </>
              )}
            </button>
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
  const { uiStrings } = useContactConfig();
  const mobileLabel = uiStrings.mobileLabel;
  const personalLabel = uiStrings.personalLabel;
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
        setPreviewList(parseVCard(ev.target.result, mobileLabel, personalLabel));
        setResult(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = (): void => {
    setImporting(true);
    const existingNames = new Set(contacts.map((c) => c.name?.toLowerCase().trim()));
    const fresh = previewList.filter((c) => !existingNames.has(c.name?.toLowerCase().trim()));
    setTimeout(() => {
      onImport(fresh);
      setResult({ imported: fresh.length, skipped: previewList.length - fresh.length });
      setPreviewList([]);
      setImporting(false);
    }, 400);
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
        <span className="text-sm font-bold text-foreground">{uiStrings.appleContacts || "Apple Contacts"}</span>
        <span className="text-[10px] text-muted-foreground">{uiStrings.vcardLabel || "(vCard / .vcf)"}</span>
      </div>
      <div className="p-4 space-y-4 text-left">
        {/* How to export */}
        <div className="rounded-lg bg-muted/30 border border-border p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">{uiStrings.howToExportAppleTitle || "How to export from Apple Contacts:"}</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>{uiStrings.appleExportStep1 || "Open Contacts app on Mac → Select All (⌘A)"}</li>
            <li>{uiStrings.appleExportStep2 || "File → Export vCard… → save the .vcf file"}</li>
            <li>{uiStrings.appleExportStep3 || "iPhone: Use iCloud.com → Contacts → select all → export"}</li>
            <li>{uiStrings.appleExportStep4 || "Upload the .vcf file below"}</li>
          </ol>
        </div>

        {/* Upload */}
        <input ref={fileRef} type="file" accept=".vcf,text/vcard" className="hidden" onChange={handleFile} />
        {previewList.length === 0 && !result && (
          <button
            type="button"
            onClick={() => canWrite && fileRef.current?.click()}
            disabled={!canWrite}
            className="w-full flex flex-col items-center justify-center gap-2 py-7 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer bg-card disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card"
          >
            <FileText className="w-7 h-7 opacity-40" />
            <span className="text-sm font-semibold text-foreground">{uiStrings.uploadVcfBtn || "Upload .vcf file"}</span>
            <span className="text-xs">{uiStrings.dragDropBrowse || "Drag & drop or click to browse"}</span>
          </button>
        )}

        {previewList.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                {previewList.length} {uiStrings.contactsFound || "contacts found"}
              </p>
              <button
                type="button"
                onClick={() => setPreviewList([])}
                className="text-xs min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors bg-transparent"
              >
                {uiStrings.clear || "Clear"}
              </button>
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
                  {(uiStrings.andMore || "…and {count} more").replace("{count}", String(previewList.length - 50))}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleImport}
                disabled={importing || !canWrite}
                className="flex items-center gap-2 px-5 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>
                  {(uiStrings.importContactsCount || "Import {count} contacts").replace("{count}", String(previewList.length))}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewList([]);
                  fileRef.current?.click();
                }}
                className="px-4 min-h-[44px] rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-card"
              >
                {uiStrings.chooseDifferentFile || "Choose different file"}
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-success/10 border border-success/30 text-sm text-success">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-success" />
            <div>
              <p className="font-semibold">{uiStrings.importComplete || "Import complete"}</p>
              <p className="text-xs text-success/90 mt-0.5">
                {(uiStrings.importedMsg || "{count} imported").replace("{count}", String(result.imported))}
                {result.skipped > 0 ? ` · ${(uiStrings.skippedMsg || "{count} skipped (already exist)").replace("{count}", String(result.skipped))}` : ""}
              </p>
            </div>
          </div>
        )}

        {/* Export */}
        <div className="border-t border-border pt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{uiStrings.exportAppleInstructions || "Export contacts to import into Apple Contacts"}</span>
          <button
            type="button"
            onClick={handleExport}
            disabled={contacts.length === 0}
            className="flex items-center gap-1.5 px-3.5 min-h-[44px] rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50 transition-colors bg-card"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {(uiStrings.exportVcfBtn || "Export .vcf ({count})").replace("{count}", String(contacts.length))}
            </span>
          </button>
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
export default function ContactSyncPanel({ contacts = [], onImport, canWrite = true }: ContactSyncPanelProps): React.JSX.Element {
  const { uiStrings } = useContactConfig();
  return (
    <div className="space-y-5 max-w-3xl text-left">
      {/* Info */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-info/10 border border-info/30 text-sm text-info">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-info" />
        <div>
          <h3 className="font-semibold">{uiStrings.dynamicContactSyncTitle || "Dynamic Contact Sync"}</h3>
          <p className="text-xs mt-0.5 text-info/90">
            {uiStrings.dynamicContactSyncDesc || "Connect your Google account for live sync, or upload a vCard file from Apple Contacts. Each madrasa admin manages their own connection independently."}
          </p>
        </div>
      </div>

      <GoogleContactsPanel contacts={contacts} onImport={onImport} canWrite={canWrite} />
      <AppleContactsPanel contacts={contacts} onImport={onImport} canWrite={canWrite} />
    </div>
  );
}
