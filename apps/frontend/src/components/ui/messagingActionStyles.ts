/** Shared Call / WhatsApp / SMS / Email action tone classes (detail grids + dense card icons). */

export const MESSAGING_QUICK_ACTION_BASE =
  "rounded-xl border text-center transition-colors";

export const MESSAGING_QUICK_ACTION_TONES = {
  call: "bg-info/10 text-info border-info/20 hover:bg-info/20 hover:border-info/30",
  whatsapp: "bg-success/10 text-success border-success/30 hover:bg-success/20",
  sms: "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20",
  email: "bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20",
} as const;

/** Dense icon-only messaging buttons (directory cards). */
export const MESSAGING_ICON_BTN =
  "min-h-11 min-w-11 rounded-xl border shadow-none transition-colors";

export const MESSAGING_ICON_BTN_TONES = {
  call: "border-border/50 bg-muted/40 text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
  whatsapp: "border-success/30 bg-success/5 text-success hover:text-success hover:bg-success/10",
  sms: "border-primary/30 bg-primary/5 text-primary hover:text-primary hover:bg-primary/10",
  email: "border-secondary/30 bg-secondary/5 text-secondary hover:text-secondary hover:bg-secondary/10",
} as const;
