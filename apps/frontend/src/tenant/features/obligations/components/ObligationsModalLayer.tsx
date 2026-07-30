import React from "react";
import { AnimatePresence } from "framer-motion";
import type { MessageComposerProps } from "@/components/ui/MessageComposer";
import { ObligationCollectionDetail } from "@/tenant/features/obligations/components/ObligationCollectionDetail";
import { ObligationCollectionForm } from "@/tenant/features/obligations/components/ObligationCollectionForm";
import type {
  ObligationCollection,
  ObligationDistribution,
  ObligationType,
  Mujtahid,
  MujtahidRep,
  WakalaType,
} from "@/lib/data/obligationsData";

const MessageComposer = React.lazy(() => import("@/components/ui/MessageComposer"));

interface MessagingTarget {
  channel: "sms" | "whatsapp" | "email";
  recipients: MessageComposerProps["recipients"];
}

interface ObligationsModalLayerProps {
  showForm: boolean;
  canWrite: boolean;
  showDeleted: boolean;
  viewCollection: ObligationCollection | null;
  obligationTypes: ObligationType[];
  reps: MujtahidRep[];
  mujtahids: Mujtahid[];
  wakalaTypes: WakalaType[];
  distributions: ObligationDistribution[];
  collections: ObligationCollection[];
  messagingTarget: MessagingTarget | null;
  onSaveCollection: (collection: ObligationCollection) => Promise<void>;
  onCloseForm: () => void;
  onCloseDetail: () => void;
  onCloseComposer: () => void;
}

export function ObligationsModalLayer({
  showForm,
  canWrite,
  showDeleted,
  viewCollection,
  obligationTypes,
  reps,
  mujtahids,
  wakalaTypes,
  distributions,
  collections,
  messagingTarget,
  onSaveCollection,
  onCloseForm,
  onCloseDetail,
  onCloseComposer,
}: ObligationsModalLayerProps) {
  return (
    <>
      <AnimatePresence>
        {showForm && canWrite && !showDeleted && (
          <ObligationCollectionForm
            obligationTypes={obligationTypes}
            reps={reps}
            mujtahids={mujtahids}
            wakalaTypes={wakalaTypes}
            existingCollections={collections}
            onSave={onSaveCollection}
            onClose={onCloseForm}
          />
        )}
        {viewCollection && (
          <ObligationCollectionDetail
            collection={viewCollection}
            obligationTypes={obligationTypes}
            reps={reps}
            mujtahids={mujtahids}
            wakalaTypes={wakalaTypes}
            distributions={distributions}
            onClose={onCloseDetail}
          />
        )}
      </AnimatePresence>

      {messagingTarget && (
        <React.Suspense fallback={null}>
          <MessageComposer
            channel={messagingTarget.channel}
            recipients={messagingTarget.recipients}
            onClose={onCloseComposer}
          />
        </React.Suspense>
      )}
    </>
  );
}
