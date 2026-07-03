---
description: Unified SMS/WhatsApp Campaign and templates specifications.
paths:
  - "apps/frontend/src/tenant/features/messaging/**"
  - "apps/frontend/src/components/ui/MessageComposer.tsx"
---

# 💬 MMS Messaging & Campaign Specification

This specification governs the design, behavior, and modular boundaries of the messaging system, campaign composition controls, and templates registry in the Madrasa Management System.

---

## 1. Modular Boundaries & Decoupled Architecture
- All messaging operations must use the decoupled `MessageComposer` component, passing target recipients via the generic `MessagingRecipient` interface:
  ```typescript
  export interface MessagingRecipient {
    id: string | number;
    name: string;
    phone: string;
  }
  ```
- Do not import contacts-specific schema requirements directly inside messaging primitives. Maintain a clean interface boundary.

## 2. Personalization & Safe Openers
- Personalization placeholders (such as `{name}`) must be evaluated on the client dynamically.
- To prevent browser popup blockers from stopping batch WhatsApp triggers, actions must open individual tabs sequentially with slight, configurable delays.
- Fallback gracefully to `openDeviceSmsComposer` for SMS dispatches.

## 3. History Logging & Preset Management
- Log all outbound campaign runs inside user-scoped message store logs (`messages_u:${userId}`) for diagnostic tracking.
- Store template presets globally and custom user-created presets in local IndexedDB caches (`messages_templates_u:${userId}`).
- Provide clear search indexes and channel-specific filters (e.g., SMS vs. WhatsApp toggle status).
