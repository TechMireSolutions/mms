/** Shared validation error line below form fields. */
export const FORM_ERROR = 'text-xs text-destructive mt-1';

/** Shared label class for modal / registry-driven forms. */
export const FORM_LABEL =
  'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground';

/** Shared text input — full width, 44px min height, primary focus ring (no border/shadow transitions). */
export const FORM_INPUT =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 min-h-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40';

export const FORM_SELECT = `${FORM_INPUT} cursor-pointer`;

export const FORM_TEXTAREA = `${FORM_INPUT} min-h-20 resize-none py-2`;

/** Input with a left icon (e.g. user modals). */
export const FORM_INPUT_ICON = `${FORM_INPUT} ps-9 pe-3`;

/** Compact input for dense tables (e.g. journal lines). */
export const FORM_INPUT_COMPACT =
  'w-full rounded-lg border border-border bg-background px-2 py-2 min-h-11 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40';

/** Compact builder panels (widget builder, analytics config). */
export const FORM_INPUT_BUILDER = `${FORM_INPUT_COMPACT} bg-card/40 backdrop-blur-md font-semibold`;

/** OTP digit cell (2FA, platform verify). */
export const FORM_OTP_DIGIT =
  'w-11 min-h-[3.25rem] text-center text-xl font-bold rounded-xl border-2 bg-card text-foreground focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20';

/** Unified checkbox style — borders, focus rings, primary accent, cursor pointer. */
export const FORM_CHECKBOX =
  "peer relative h-4 w-4 shrink-0 cursor-pointer rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground after:absolute after:left-1/2 after:top-1/2 after:h-11 after:w-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']";

/** Unified form card container style — matching the centralized Card component. */
export const FORM_CARD =
  'relative overflow-hidden group group/card rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300';

/** Ultra-compact select trigger style (primarily for dashboard widget chart filters) */
export const FORM_SELECT_MINI =
  'min-h-11 h-11 px-2 py-2 rounded text-xs font-bold bg-card border-none text-foreground focus:outline-none cursor-pointer w-auto gap-1 shadow-none [&_svg]:hidden [&>span]:line-clamp-none';

