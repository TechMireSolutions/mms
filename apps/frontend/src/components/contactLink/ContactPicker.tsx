import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useId,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { X, Search, Plus, User, Mail, Phone, Camera } from "lucide-react";
import {
  type Contact,
  filterContactsForQuery,
  getDisplayName,
  getPrimaryPhone,
  getPrimaryEmail,
  getPrimaryAddress,
} from "@mms/shared";
import { cn } from "@/lib/utils";
import { uploadUserImage } from "@/lib/imageUpload";
import { genderBadgeClass } from "@/lib/semanticTone";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import ContactCreateModal, {
  type ContactCreateDefaults,
} from "./ContactCreateModal";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactById, useContactsPaginated } from "@/tenant/hooks/collections/contacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { notify } from "@/lib/notify";
import { reportClientError } from "@/lib/clientErrorReporting";

const PICKER_PAGE_SIZE = 8;

export interface ContactPickerProps {
  label: string;
  value: string | number | null;
  onChange: (id: string | number | null, contact?: Contact | null) => void;
  /** Client-side list; omit to use server search (globle2 §10). */
  contacts?: Contact[];
  excludeIds?: (string | number | null)[];
  filterGender?: string;
  hasPhone?: boolean;
  /** Show create-contact control on the search input. Default true. */
  allowCreate?: boolean;
  /** Prefill / lock fields when opening the shared contact form (e.g. father = male). */
  createDefaults?: ContactCreateDefaults;
  onAvatarChange?: (avatarUrl: string) => void;
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyHint?: string;
  createLabel?: string;
  createWithQueryLabel?: (query: string) => string;
  error?: boolean;
  id?: string;
  name?: string;
}

function useAnchorMenuStyle(
  open: boolean,
  anchorRef: React.RefObject<HTMLElement | null>,
): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({});

  useLayoutEffect(() => {
    if (!open) return;

    const update = (): void => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const gap = 6;
      const maxHeight = 240;
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const placeAbove = spaceBelow < 160 && rect.top > spaceBelow;
      setStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        zIndex: 70,
        maxHeight,
        ...(placeAbove
          ? { bottom: window.innerHeight - rect.top + gap, top: "auto" }
          : { top: rect.bottom + gap, bottom: "auto" }),
      });
    };

    update();
    window.addEventListener("resize", update);
    // Capture scroll inside modals / overflow containers.
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef]);

  return style;
}

export default function ContactPicker({
  label,
  value,
  onChange,
  contacts,
  excludeIds = [],
  filterGender,
  hasPhone,
  allowCreate = true,
  createDefaults,
  onAvatarChange,
  searchPlaceholder,
  emptyTitle,
  emptyHint,
  createLabel,
  createWithQueryLabel,
  error = false,
  id,
  name,
}: ContactPickerProps): React.JSX.Element {
  const { t } = useTranslation();

  const resolvedEmptyTitle = emptyTitle ?? t("contacts.picker.emptyTitle");
  const resolvedEmptyHint = emptyHint ?? t("contacts.picker.emptyHint");
  const resolvedCreateLabel = createLabel ?? t("contacts.picker.createLabel");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createQuery, setCreateQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const serverMode = contacts === undefined;
  const fallbackId = useId();
  const resolvedId = id || fallbackId;
  const resolvedName = name || fallbackId;
  const avatarInputId = `${resolvedId}-avatar`;
  const menuStyle = useAnchorMenuStyle(open, anchorRef);

  const normalizedExcludeIds = useMemo(
    () =>
      excludeIds
        .filter((excludeId): excludeId is string | number => excludeId != null && String(excludeId).length > 0)
        .map(String),
    [excludeIds],
  );

  const debouncedQuery = useDebounce(query, 250);
  const { data: searchPage, isFetching: isSearching } = useContactsPaginated({
    page: 1,
    limit: PICKER_PAGE_SIZE,
    search: debouncedQuery,
    gender: filterGender,
    hasPhone,
    excludeIds: normalizedExcludeIds,
    enabled: serverMode && open,
  });
  const { data: selectedFromServer } = useContactById(
    value != null ? String(value) : undefined,
    serverMode && value != null,
  );

  const directory = useMemo(
    () => (serverMode ? (searchPage?.contacts ?? []) : contacts),
    [serverMode, searchPage?.contacts, contacts],
  );

  const closeDropdown = useCallback(() => {
    setQuery("");
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      closeDropdown();
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") closeDropdown();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, closeDropdown]);

  const matches = useMemo(
    () =>
      filterContactsForQuery(directory, {
        search: query,
        gender: filterGender,
        hasPhone,
        excludeIds: normalizedExcludeIds,
      }).slice(0, PICKER_PAGE_SIZE),
    [directory, normalizedExcludeIds, hasPhone, filterGender, query],
  );

  const selected = useMemo(() => {
    if (value == null) return null;
    const valStr = String(value);
    const matchById = (contact: Contact) => String(contact.id) === valStr;
    return (
      (serverMode ? selectedFromServer : contacts?.find(matchById)) ??
      directory.find(matchById)
    );
  }, [serverMode, selectedFromServer, contacts, value, directory]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadUserImage(file, "avatar");
      onAvatarChange?.(url);
    } catch (err) {
      notify.error(t("account.photoUploadFailed"));
      reportClientError(err, { scope: "ContactPicker.avatar_upload" });
    }
    event.target.value = "";
  }, [onAvatarChange, t]);

  const openCreateFlow = useCallback((searchText: string): void => {
    setCreateQuery(searchText);
    setCreateOpen(true);
  }, []);

  if (selected) {
    const genderBadgeColor = genderBadgeClass(selected.gender ?? "");
    const selectedPhone = getPrimaryPhone(selected);
    const selectedEmail = getPrimaryEmail(selected);
    const selectedName = getDisplayName(selected);

    return (
      <div className="relative">
        <label htmlFor={resolvedId} className={FORM_LABEL}>{label}</label>
        <div className="group relative flex items-center gap-3.5 p-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/[0.01] to-primary/[0.04] dark:from-primary/[0.02] dark:to-primary/[0.06] shadow-sm hover:shadow-md transition-all duration-200">
          <div
            onClick={() => onAvatarChange && fileInputRef.current?.click()}
            className={cn(
              "w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-muted border border-border flex items-center justify-center shadow-sm relative",
              onAvatarChange && "cursor-pointer group/avatar",
            )}
          >
            <UserAvatar
              id={selected.id}
              name={selectedName}
              avatar={selected.avatar}
              className="w-full h-full text-sm"
            />
            {onAvatarChange && (
              <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity duration-150">
                <Camera className="w-4 h-4 text-white" />
              </div>
            )}
            <input
              id={avatarInputId}
              name={`${resolvedName}-avatar`}
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              aria-label={t("account.changePhoto")}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <p className="text-sm font-bold text-foreground truncate">{selectedName}</p>
              {selected.gender && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${genderBadgeColor}`}>
                  {formatContactGenderLabel(selected.gender, t)}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {selectedPhone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-muted-foreground/60" />
                  {selectedPhone}
                </span>
              )}
              {selectedEmail && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-muted-foreground/60" />
                  {selectedEmail}
                </span>
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(null)}
            className="rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors focus:outline-none focus:ring-2 focus:ring-destructive/20 shadow-none"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <input type="hidden" id={resolvedId} name={resolvedName} value={value ?? ""} />
      </div>
    );
  }

  const menu = open
    ? createPortal(
        <div
          ref={menuRef}
          id={`${resolvedId}-listbox`}
          style={menuStyle}
          className="overflow-y-auto rounded-xl border border-border bg-card shadow-xl divide-y divide-border/60"
          role="listbox"
          aria-label={label}
        >
          {isSearching && matches.length === 0 && (
            <div className="px-4.5 py-3 text-xs text-muted-foreground text-center">
              {t("common.loading")}
            </div>
          )}
          {matches.length === 0 && !isSearching && (
            <div className="px-4.5 py-4 text-xs text-muted-foreground flex flex-col items-center justify-center gap-1.5 text-center bg-muted/5">
              <User className="w-5 h-5 text-muted-foreground/45" />
              <p className="font-semibold text-foreground/80">{resolvedEmptyTitle}</p>
              <p className="text-xs text-muted-foreground">{resolvedEmptyHint}</p>
            </div>
          )}
          {matches.map((contact) => {
            const contactPhone = getPrimaryPhone(contact);
            const primaryAddr = getPrimaryAddress(contact);
            const contactCity = primaryAddr?.city || (contact.city as string | undefined);
            const contactName = getDisplayName(contact);

            return (
              <Button
                key={contact.id}
                type="button"
                variant="ghost"
                role="option"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(contact.id, contact);
                  closeDropdown();
                }}
                onClick={(event) => {
                  event.preventDefault();
                  onChange(contact.id, contact);
                  closeDropdown();
                }}
                className="w-full flex items-center h-auto font-normal justify-start gap-3 px-3.5 py-2.5 hover:bg-muted transition-colors text-left focus:outline-none rounded-none shadow-none text-foreground"
              >
                <UserAvatar
                  id={contact.id}
                  name={contactName}
                  avatar={contact.avatar}
                  className="w-8 h-8 text-xs flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{contactName}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate mt-0.5">
                    {contactPhone || t("contacts.table.emptyDash")}
                    {contactCity && <span>· {contactCity}</span>}
                  </p>
                </div>
              </Button>
            );
          })}
        </div>,
        document.body,
      )
    : null;

  const createActionLabel = query.trim()
    ? (createWithQueryLabel?.(query.trim()) ?? t("contacts.picker.createWithQuery", { query: query.trim() }))
    : resolvedCreateLabel;

  return (
    <div className="relative">
      <label htmlFor={resolvedId} className={FORM_LABEL}>{label}</label>
      <div ref={anchorRef} className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/75 pointer-events-none" />
        <Input
          id={resolvedId}
          name={resolvedName}
          className={cn(
            "ps-9.5",
            allowCreate ? (query ? "pe-16" : "pe-10") : (query ? "pe-9" : "pe-3"),
            error && "border-destructive focus-visible:ring-destructive",
          )}
          placeholder={searchPlaceholder ?? t("contacts.searchPlaceholder")}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
          aria-expanded={open}
          aria-controls={open ? `${resolvedId}-listbox` : undefined}
          role="combobox"
        />
        <div className="absolute end-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {query ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted shadow-none"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          ) : null}
          {allowCreate ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onMouseDown={(event) => {
                event.preventDefault();
                openCreateFlow(query);
                closeDropdown();
              }}
              title={createActionLabel}
              aria-label={createActionLabel}
              className="text-primary hover:text-primary hover:bg-primary/10 transition-colors rounded-md shadow-none"
            >
              <Plus className="w-4 h-4" />
            </Button>
          ) : null}
        </div>
      </div>
      {menu}

      {allowCreate ? (
        <ContactCreateModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          initialName={createQuery}
          createDefaults={createDefaults}
          onCreated={(contact) => {
            onChange(contact.id, contact);
            setCreateOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
