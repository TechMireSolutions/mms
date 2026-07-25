---
name: mms-messaging
description: Dynamic messaging module capability. Manages SMS and WhatsApp campaign composition, personalization rules, template presets, and sent log histories. Use when modifying MessagingPage, message history records, or the generic MessageComposer component.
---

# MMS Messaging Workflow

## Components Layout

1. **`MessagingPage.tsx`**: Top-level central command page mapping Work (`logs`, `compose`), Reports (charts / stats), and Setup (`templates`) with dynamic statistics counters.
2. **`MessageComposer.tsx`**: Universal modal primitive mapping generic recipient details, personalized placeholders, delay dispatch offsets, template selection, and central logging.
3. **`useMessageComposerState.ts`**: Reusable hook used across all feature modules to manage channel target selection and open/close state of `MessageComposer`.

---

## Core Operations

### Universal Connection Across Modules
All contactable feature modules (Students, Enrollments, Finance, Sessions, Examinations, Accounting, Contacts, Teachers, Users, Obligations, Hasanat, Attendance) connect to `MessageComposer` using `useMessageComposerState`.

### Personalization Logic
Placeholders inside templates must be parsed and substituted on the client:
```typescript
export function personalizeMessage(body: string, recipient: MessagingRecipient): string {
  return body.replace(/{name}/gi, recipient.name || '');
}
```

### Single Source of Truth
- **Sent History**: All dispatches write to `messages_u:${user.id}` and trigger `window.dispatchEvent(new CustomEvent('local-database-update'))` so `MessagingPage` updates live.
- **Templates**: Custom templates saved in `messages_templates_u:${user.id}` are automatically loaded in `MessageComposer` across all feature modules.

### Campaign Triggers
- **SMS**: Dispatched via `openDeviceSmsComposer(phone, body)` fallback.
- **WhatsApp**: Dispatched using automated tab openers with incremental opening delays to bypass browser popup limits.
- **Email**: Dispatched via `mailto:` links with subject & personalized body.
