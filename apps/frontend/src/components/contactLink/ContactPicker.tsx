import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, User, Mail, Phone, Camera } from 'lucide-react';
import type { Contact } from '@mms/shared';
import { cn } from '@/lib/utils';
import { uploadUserImage } from '@/lib/imageUpload';
import { genderAvatarGradient, genderBadgeClass } from '@/lib/semanticTone';
import ContactCreateModal, {
  type ContactCreateDefaults,
} from '@/components/contacts/ContactCreateModal';
import { FORM_LABEL } from '@/components/ui/formStyles';
import { useDebounce } from '@/hooks/useDebounce';
import { useContactById, useContactsPaginated } from '@/hooks/useContacts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface ContactPickerProps {
  label: string;
  value: string | number | null;
  onChange: (id: string | number | null, contact?: Contact | null) => void;
  /** Client-side list; omit to use server search (globle2 §10). */
  contacts?: Contact[];
  excludeIds?: (string | number | null)[];
  filterGender?: string;
  /** Show "Create contact" in the search dropdown. Default true. */
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
}

export default function ContactPicker({
  label,
  value,
  onChange,
  contacts,
  excludeIds = [],
  filterGender,
  allowCreate = true,
  createDefaults,
  onAvatarChange,
  searchPlaceholder,
  emptyTitle = 'No contacts found',
  emptyHint = 'Try adjusting your search terms or create a new contact below.',
  createLabel = 'Create New Contact',
  createWithQueryLabel,
  error = false,
}: ContactPickerProps): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createQuery, setCreateQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const serverMode = contacts === undefined;

  const debouncedQuery = useDebounce(query, 250);
  const { data: searchPage, isFetching: isSearching } = useContactsPaginated({
    page: 1,
    limit: 8,
    search: debouncedQuery,
    gender: filterGender,
    enabled: serverMode && open,
  });
  const { data: selectedFromServer } = useContactById(
    value != null ? String(value) : undefined,
    serverMode && value != null,
  );

  const normalizedExcludeIds = useMemo(() => excludeIds.map(String), [excludeIds]);

  const directory = serverMode ? (searchPage?.contacts ?? []) : contacts;

  const matches = directory.filter((contact) => {
    const contactPhone = (contact.phone as string | undefined) || contact.phones?.[0]?.number || '';
    if (normalizedExcludeIds.includes(String(contact.id))) return false;
    if (serverMode) return true;
    return (
      contact.name.toLowerCase().includes(query.toLowerCase()) || contactPhone.includes(query)
    );
  }).slice(0, 8);

  const selected =
    (serverMode ? selectedFromServer : contacts.find((contact) => String(contact.id) === String(value))) ??
    directory.find((contact) => String(contact.id) === String(value));

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadUserImage(file, 'avatar');
      onAvatarChange?.(url);
    } catch {
      // ignore
    }
    event.target.value = '';
  };

  const openCreateFlow = (searchText: string): void => {
    setCreateQuery(searchText);
    setCreateOpen(true);
  };

  if (selected) {
    const genderBadgeColor = genderBadgeClass(selected.gender ?? '');
    const initials = selected.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
    const avatarGradient = genderAvatarGradient(selected.gender ?? '');
    const selectedPhone = (selected.phone as string | undefined) || selected.phones?.[0]?.number;
    const selectedEmail = (selected.email as string | undefined) || selected.emails?.[0]?.address;

    return (
      <div className="relative">
        <span className={FORM_LABEL}>{label}</span>
        <div className="group relative flex items-center gap-3.5 p-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/[0.01] to-primary/[0.04] dark:from-primary/[0.02] dark:to-primary/[0.06] shadow-sm hover:shadow-md transition-all duration-200">
          <div
            onClick={() => onAvatarChange && fileInputRef.current?.click()}
            className={cn(
              'w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-muted border border-border flex items-center justify-center shadow-sm relative',
              onAvatarChange && 'cursor-pointer group/avatar',
            )}
          >
            {selected.avatar ? (
              <img src={selected.avatar} alt={selected.name} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-bold text-sm`}>
                {initials}
              </div>
            )}
            {onAvatarChange && (
              <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity duration-150">
                <Camera className="w-4 h-4 text-white" />
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <p className="text-[13px] font-bold text-foreground truncate">{selected.name}</p>
              {selected.gender && (
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full capitalize ${genderBadgeColor}`}>
                  {selected.gender}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
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
            onClick={() => onChange(null)}
            className="h-auto p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors focus:outline-none focus:ring-2 focus:ring-destructive/20 shadow-none"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <span className={FORM_LABEL}>{label}</span>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/75 pointer-events-none" />
        <Input
          className={cn("pl-9.5 pr-8.5", error && "border-destructive focus-visible:ring-destructive")}
          placeholder={searchPlaceholder ?? `Search ${label.toLowerCase()}…`}
          value={query}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 h-auto rounded-md hover:bg-muted shadow-none"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
        <AnimatePresence>
          {open && (matches.length > 0 || allowCreate || (serverMode && isSearching)) && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.99 }}
              transition={{ duration: 0.15 }}
              className="absolute z-20 left-0 right-0 top-full mt-1.5 bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-border/60"
            >
              {matches.length === 0 && !isSearching && (
                <div className="px-4.5 py-4 text-xs text-muted-foreground flex flex-col items-center justify-center gap-1.5 text-center bg-muted/5">
                  <User className="w-5 h-5 text-muted-foreground/45" />
                  <p className="font-semibold text-foreground/80">{emptyTitle}</p>
                  <p className="text-[10px] text-muted-foreground">{emptyHint}</p>
                </div>
              )}
              {matches.map((contact) => {
                const contactInitials = contact.name.split(' ').map((namePart) => namePart[0]).join('').slice(0, 2).toUpperCase();
                const contactGradient = genderAvatarGradient(contact.gender ?? '');
                const contactPhone = (contact.phone as string | undefined) || contact.phones?.[0]?.number;
                const contactCity = contact.city as string | undefined;
                const contactTag = contact.tag as string | undefined;

                return (
                  <Button
                    key={contact.id}
                    type="button"
                    variant="ghost"
                    onMouseDown={() => { onChange(contact.id, contact); setQuery(''); setOpen(false); }}
                    className="w-full flex items-center h-auto font-normal justify-start gap-3 px-3.5 py-2.5 hover:bg-muted transition-colors text-left focus:outline-none rounded-none shadow-none text-foreground"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${contactGradient} flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white shadow-sm`}>
                      {contactInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate">{contact.name}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate mt-0.5">
                        {contactPhone || '—'}
                        {contactCity && <span>· {contactCity}</span>}
                        {contactTag && <span className="bg-primary/5 text-primary text-[9px] px-1.5 py-0.2 rounded border border-primary/10 capitalize font-medium">{contactTag}</span>}
                      </p>
                    </div>
                  </Button>
                );
              })}
              {allowCreate && (
                <Button
                  type="button"
                  variant="ghost"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    openCreateFlow(query);
                    setQuery('');
                    setOpen(false);
                  }}
                  className="w-full flex items-center h-auto justify-start gap-2 px-4 py-3 hover:bg-primary/5 hover:text-primary text-primary font-semibold text-xs text-left transition-colors border-t border-border rounded-none shadow-none"
                >
                  <Plus className="w-4 h-4 text-primary" />
                  {query
                    ? (createWithQueryLabel?.(query) ?? `Create contact "${query}"`)
                    : createLabel}
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
