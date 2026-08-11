# Students parity sweep 4 — drawer polish micro-gaps

Fresh audit of Students vs Contacts (gold standard) across backend, Work tier, detail drawer, and Reports. Sweep 4 closes the last verified micro-gaps found in the detail drawer. Contacts-domain features (duplicates/merge/sync, timeline/files/AI summary, saved reports, VCF), the drawer SubTabBar restructure / `settingsSubTabs` capability, the `PUT` audit field-diff (`summarizeStudentFieldChanges`), and cross-module guardian-card navigation stay out of scope (documented below).

## Detail drawer

### 1. Hero avatar parity
Contacts passes `avatar={contact.avatar}` to the shared `PersonDetailHeroCard`; Students passes none. Student records already carry an `avatar` field (`packages/shared/src/studentValidation.ts`).

- `StudentDetailHero.tsx`: pass `avatar={student.avatar}` to `PersonDetailHeroCard`.

### 2. WhatsApp gate / recipient consistency
Contacts gates WhatsApp on `onWhatsApp && hasWhatsApp(contact)` and sends the same entity, so gate ≡ recipient. Students gates on `hasWhatsApp(primaryContact ?? {})` (linked contact only) but builds the recipient from `primaryPhone`, which falls back to the legacy `student.phone` scalar. When a student has no linked contact (or the contact has no phone) yet `student.phone` is WhatsApp-capable, the WhatsApp action is wrongly hidden while SMS/call still render — a false negative.

- `useStudentDetailModel.ts`: compute `hasWhatsAppContact` from the effective `primaryPhone` (`hasWhatsApp({ phone: primaryPhone ?? undefined })`) so gate and recipient number always agree.

### 3. Gender icon SSOT in drawer field rows
Contacts `FieldGroupCard` resolves the gender row icon via the shared `getGenderIcon` / `getGenderIconClass` (`@/lib/genderUi`), and `StudentContactSection` already uses the same SSOT. `StudentDetailFieldsSection` is the outlier: the gender row hardcodes `User`.

- `StudentDetailFieldsSection.tsx`: gender row uses `getGenderIcon(student.gender)` + `getGenderIconClass(student.gender)` (empty gender → `UserRound`/muted default, matching `GenderIcon`).

## Verify
`pnpm typecheck`, FE `pnpm lint`, scoped frontend tests (drawer-adjacent), completion review.

## Deferred (documented, unchanged)
- Guardian-card navigation to the linked contact drawer (`onNavigateToContact` is Contacts-internal; cross-module wiring required)
- Drawer SubTabBar restructure + `settingsSubTabs` capability
- `PUT` audit field-diff (`summarizeStudentFieldChanges`) — needs before-state threading through `registerResourceRoutes`
- Contacts-domain features: timeline/files/AI summary, duplicates/merge/sync, saved reports, VCF export
