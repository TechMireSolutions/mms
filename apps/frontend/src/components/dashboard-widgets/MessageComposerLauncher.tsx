import MessageComposer from "@/components/ui/MessageComposer";
import type { MessagingTarget } from "@/hooks/useMessageComposerState";

/**
 * Renders the shared `MessageComposer` dialog when a messaging target is
 * active, otherwise nothing. Deduplicates the trailing composer block used
 * by the outstanding-fees and overdue-obligations widgets.
 */
export function MessageComposerLauncher({
  messagingTarget,
  onClose,
}: {
  messagingTarget: MessagingTarget | null;
  onClose: () => void;
}) {
  if (!messagingTarget) return null;
  return (
    <MessageComposer
      channel={messagingTarget.channel}
      recipients={messagingTarget.recipients}
      onClose={onClose}
    />
  );
}