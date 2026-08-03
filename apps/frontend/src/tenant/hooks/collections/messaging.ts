/**
 * Cross-module public surface for Messaging Query keys / hooks.
 * Other features must import from here — not `@/tenant/features/messaging/hooks/*`.
 */
export { MESSAGING_CONTACTS_RESOLVE_QUERY_KEY } from '@/tenant/features/messaging/hooks/useMessagingContactsByIds';
export { MESSAGING_RECIPIENTS_QUERY_KEY } from '@/tenant/features/messaging/hooks/useMessagingWorkRecipients';
