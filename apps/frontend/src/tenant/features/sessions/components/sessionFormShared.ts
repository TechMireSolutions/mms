import { AppTranslationKey, DEFAULT_CURRENCIES, todayISO, applySessionDfsCustomFieldDefaults, type TabConfig } from '@mms/shared';
import type { Session } from '@/lib/data/sessionsData';

export const SESSION_STATUSES = ['active', 'upcoming', 'completed', 'cancelled'] as const;
export const SESSION_CURRENCIES = DEFAULT_CURRENCIES.map((currency) => currency.code);

export type SessionFormDraft = Omit<Partial<Session>, 'baseFee'> & {
  baseFee: string;
  customData?: Record<string, unknown>;
};

export const SESSION_TYPE_LABEL_KEYS: Record<string, AppTranslationKey> = {
  Hifz: 'sessions.types.hifz',
  Qaidah: 'sessions.types.qaidah',
  Tajweed: 'sessions.types.tajweed',
  'Islamic Studies': 'sessions.types.islamicStudies',
  Arabic: 'sessions.types.arabic',
  Other: 'sessions.types.other',
};

export function buildEmptySessionDraft(defaultType: string, defaultCurrency: string): SessionFormDraft {
  return {
    name: '',
    type: defaultType,
    status: 'active',
    startDate: todayISO(),
    endDate: '',
    baseFee: '',
    currency: defaultCurrency,
    description: '',
    classes: [],
    timetable: [],
    discounts: [],
    budget: { totalRevenue: 0, collected: 0, expenses: [], incomes: [] },
    events: [],
    tabarruk: [],
    customData: {},
  };
}

export function buildSessionDraftFromRecord(
  session: Session | null | undefined,
  defaultType: string,
  defaultCurrency: string,
  dfsTabs?: TabConfig[],
): SessionFormDraft {
  const draft: SessionFormDraft = {
    name: session?.name ?? '',
    type: session?.type ?? defaultType,
    status: session?.status ?? 'active',
    startDate: session?.startDate ?? todayISO(),
    endDate: session?.endDate ?? '',
    baseFee: session?.baseFee == null ? '' : String(session.baseFee),
    currency: session?.currency ?? defaultCurrency,
    description: session?.description ?? '',
    classes: session?.classes ?? [],
    timetable: session?.timetable ?? [],
    discounts: session?.discounts ?? [],
    budget: session?.budget ?? { totalRevenue: 0, collected: 0, expenses: [], incomes: [] },
    events: session?.events ?? [],
    tabarruk: session?.tabarruk ?? [],
    customData: (session as { customData?: Record<string, unknown> } | undefined)?.customData ?? {},
  };
  return dfsTabs ? applySessionDfsCustomFieldDefaults(draft as unknown as Partial<Session>, dfsTabs) as unknown as SessionFormDraft : draft;
}

/** Stable snapshot for FormModal dirty detection (editable fields only). */
export function sessionFormDraftSnapshot(draft: SessionFormDraft): string {
  return JSON.stringify({
    name: draft.name ?? '',
    type: draft.type ?? '',
    status: draft.status ?? '',
    startDate: draft.startDate ?? '',
    endDate: draft.endDate ?? '',
    baseFee: draft.baseFee ?? '',
    currency: draft.currency ?? '',
    description: draft.description ?? '',
    customData: draft.customData ?? {},
  });
}
