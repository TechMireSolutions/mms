---
trigger: model_decision
---

# MMS Entity Forms (Add / Edit Modals)

All **create / edit entity** dialogs share one shell. Do not hand-roll `fixed inset-0` overlays in feature modules.

Modal `title`, `cancelLabel`, `saveLabel`, and validation `error` strings use **`t()`** (`mms-i18n.md`) — not hardcoded English.

`FormModal` / `Modal` provide focus trap via Radix — do not bypass with custom overlays (`mms-a11y.md`).

## Required shell: `FormModal`

```tsx
import FormModal from "@/components/ui/FormModal";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";

<FormModal
  open={open}
  onClose={onClose}
  title={…}
  icon={ModuleIcon}          // optional Lucide icon
  size="md" | "lg"           // md = single panel; lg = tabbed
  tall                       // fixed height for multi-tab forms
  tabs={…}                   // optional — pill SubTabBar
  activeTab={…}
  onTabChange={…}
  error={validationMessage}  // string or string[]
  cancelLabel={…}
  saveLabel={…}
  onSave={handleSave}
  saving={saving}
  saveDisabled={…}
  lang={…} dir={…}           // when form language ≠ UI language
>
  {panelContent}
</FormModal>
```

`FormModal` composes `Modal` + optional `SubTabBar` + error banner + footer (`Cancel` outline + `Save` primary with Save icon).

## Tabbed forms

| Rule | Detail |
|------|--------|
| Tab control | `SubTabBar` pill style only — **no** custom underline / icon tab bars |
| Tab ids | Registry- or config-driven; same pattern as module Configuration fields |
| Height | `tall` on `FormModal` — `h-[88vh] max-h-[700px]`; body scrolls, chrome fixed |
| Animation | Tab content fade/slide inside body — never animate dialog height |

Examples: `ContactForm`, `QuestionForm`.

## Field styling

Use shared tokens from `components/ui/formStyles.ts`:

- `FORM_LABEL` — uppercase caption
- `FORM_INPUT` — full-width, `min-h-[44px]`, primary focus ring

Contact collection fields keep `FormPrimitives` (`INPUT`, `LABEL`, `COLLECTION_CARD`, …) — same sizing rules.

## Validation (react-hook-form + Zod)

Simple entity modals use **react-hook-form** + **Zod** + shadcn `Form` primitives:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { editUserSchema } from '@/lib/forms/userSchemas';
import { TranslatedFormMessage } from '@/lib/forms/TranslatedFormMessage';

const form = useForm({ resolver: zodResolver(editUserSchema), defaultValues: { … } });
const onSave = form.handleSubmit((values) => { … });
```

- Schemas in `lib/forms/*Schemas.ts` — store `AppTranslationKey` strings as Zod messages.
- `TranslatedFormMessage` + `firstZodFieldError()` for i18n error display.
- Reference: `EditUserModal`, `InviteUserModal`.

## Errors & footer

- Validation messages → `error` prop on `FormModal` (destructive banner at top of body).
- Do **not** use hardcoded `bg-red-50` / `text-red-600` error boxes.
- Footer extras (e.g. contact name preview) → `footerStart` prop.

## Banned patterns

```tsx
// ❌ Custom overlay in feature forms
<div className="fixed inset-0 z-50 …">
  <motion.div className="… max-h-[92vh]">…</motion.div>
</div>

// ❌ Inline border-b tab strip with icons
<div className="flex border-b …">{tabs.map(…)}</div>

// ❌ Ad-hoc save/cancel buttons with different padding/sizes
<button className="px-5 min-h-[44px] bg-primary …">Save</button>
```

## `open` prop

Parent pages pass `open={showModal}` and keep the form mounted (for exit animation). Avoid `{show && <Form …/>}` unmount-only patterns.

## Migration debt

Legacy custom overlays (`StudentForm`, `JournalEntryForm`, module-specific `*Modal`) → migrate to `FormModal` when touched.
