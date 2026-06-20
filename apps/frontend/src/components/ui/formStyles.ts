/** Shared validation error line below form fields. */
export const FORM_ERROR = 'text-xs text-destructive mt-1';

/** Shared label class for modal / registry-driven forms. */
export const FORM_LABEL =
  'mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground';

/** Shared text input — full width, 44px min height, primary focus ring (no border/shadow transitions). */
export const FORM_INPUT =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 min-h-[44px] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40';

export const FORM_SELECT = `${FORM_INPUT} cursor-pointer`;

export const FORM_TEXTAREA = `${FORM_INPUT} min-h-[80px] resize-none py-2`;

/** Input with a left icon (e.g. user modals). */
export const FORM_INPUT_ICON = `${FORM_INPUT} pl-9 pr-3`;

/** Compact input for dense tables (e.g. journal lines). */
export const FORM_INPUT_COMPACT =
  'w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40';

/** Compact builder panels (widget builder, analytics config). */
export const FORM_INPUT_BUILDER = `${FORM_INPUT_COMPACT} bg-card/40 backdrop-blur-md font-semibold`;

/** OTP digit cell (2FA, platform verify). */
export const FORM_OTP_DIGIT =
  'w-11 min-h-[52px] text-center text-xl font-bold rounded-xl border-2 bg-card text-foreground focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20';
