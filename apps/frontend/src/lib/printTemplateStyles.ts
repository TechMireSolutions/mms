/**
 * MMS Print and Document Template Design Tokens.
 *
 * Centralizes hex color literals required specifically for physical print media (A4/Letter),
 * PDF generation canvases, canvas/SVG element renderers, and default certificate/voucher templates.
 *
 * Rule: mms-ui-ux-design.md §2 — interactive web UI uses semantic tokens (hsl/oklch via Tailwind @theme);
 * physical print styling and template editor defaults are quarantined here as SSOT.
 */

export const PRINT_COLORS = {
  white: '#ffffff',
  black: '#111827',
  darkGray: '#374151',
  mediumGray: '#4b5563',
  lightGray: '#6b7280',
  borderGray: '#d1d5db',
  borderLight: '#e5e7eb',
  borderLighter: '#f3f4f6',
  ruleGray: '#9ca3af',
  slateDark: '#0f172a',
  slateMedium: '#334155',
  slateLight: '#64748b',
  primaryBlue: '#0369a1',
  skyDivider: '#0284c7',
  accentAmber: '#b45309',
  successGreen: '#16a34a',
  emeraldGreen: '#047857',
  dangerRed: '#dc2626',
  highlightBg: '#f0f9ff',
  metallicBronze: '#cd7f32',
  metallicSilver: '#9ca3af',
} as const;

export const PRINT_NEUTRAL_PALETTE = {
  text: '#222222',
  muted: '#888888',
  caption: '#6b7280',
  subcaption: '#9ca3af',
  body: '#4b5563',
  emphasis: '#374151',
  label: '#555555',
  labelLight: '#777777',
  border: '#e5e7eb',
  placeholder: '#cccccc',
  paper: '#ffffff',
} as const;

export type PrintColorKey = keyof typeof PRINT_COLORS;
