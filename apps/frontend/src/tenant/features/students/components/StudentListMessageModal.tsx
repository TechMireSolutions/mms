import { lazy, Suspense } from "react";
import type { ReactElement } from "react";
import type { MessagingTarget } from "@/hooks/useMessageComposerState";

const MessageComposer = lazy(() => import("@/components/ui/MessageComposer"));

interface StudentListMessageModalProps {
  messagingTarget: MessagingTarget | null;
  onClose: () => void;
}

export function StudentListMessageModal({
  messagingTarget,
  onClose,
}: StudentListMessageModalProps): ReactElement | null {
  if (!messagingTarget) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <MessageComposer
        channel={messagingTarget.channel}
        recipients={messagingTarget.recipients}
        onClose={onClose}
      />
    </Suspense>
  );
}
