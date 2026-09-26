import React from "react";
import {
  SequenceNumberingPreview,
  type SequenceNumberingPreviewProps,
} from "@/components/ui/sequence-numbering";

export type FacultyIdLivePreviewProps = SequenceNumberingPreviewProps;

/**
 * Modern Live Preview banner for deterministic Employee ID configuration.
 * Thin alias over shared SequenceNumberingPreview component.
 */
export function FacultyIdLivePreview(props: FacultyIdLivePreviewProps): React.JSX.Element {
  return <SequenceNumberingPreview {...props} />;
}
