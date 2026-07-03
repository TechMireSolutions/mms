---
name: mms-messaging
description: Dynamic messaging module capability. Manages SMS and WhatsApp campaign composition, personalization rules, template presets, and sent log histories. Use when modifying MessagingPage, message history records, or the generic MessageComposer component.
---

# MMS Messaging Workflow

## Components Layout

1. **`MessagingPage.tsx`**: Top-level page mapping tabs (`logs`, `compose`, `templates`) with dynamic statistics counters.
2. **`MessageComposer.tsx`**: Decoupled modal primitive mapping generic recipient details, personalized placeholders, and delay dispatch offsets.

---

## Core Operations

### Personalization Logic
Placeholders inside templates must be parsed and substituted on the client:
```typescript
export function personalizeMessage(body: string, recipient: MessagingRecipient): string {
  return body.replace(/{name}/gi, recipient.name || '');
}
```

### Campaign Triggers
- **SMS**: Dispatched via `openDeviceSmsComposer(numbers, body)` fallback.
- **WhatsApp**: Dispatched using automated tab openers with incremental opening delays to bypass browser popup limits.
