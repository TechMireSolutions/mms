import React from 'react';
import {
  TypedConfirmDialog,
  type TypedConfirmDialogProps,
} from '@/components/ui/TypedConfirmDialog';

export type PlatformTypedConfirmDialogProps = TypedConfirmDialogProps;

/**
 * Presentational typed-confirm + password step-up dialog for platform danger ops.
 * Delegates to universal TypedConfirmDialog primitive.
 */
export function PlatformTypedConfirmDialog(
  props: PlatformTypedConfirmDialogProps,
): React.JSX.Element {
  return <TypedConfirmDialog {...props} />;
}
