import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { translateAppParams } from '@mms/shared';
import { reportClientError } from '@/lib/clientErrorReporting';
import { ErrorState } from '@/components/ui/ErrorState';

interface Props {
  children: ReactNode;
  /** Module name for reporting context (e.g. "Students"). */
  module?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Per-module error boundary — wraps each lazy route so a rendering failure
 * in one module does not crash the entire AppLayout shell.
 *
 * Falls back to a localised error card using the static EN dictionary
 * (translation context may not be mounted inside a class component).
 */
export default class ModuleErrorBoundary extends Component<Props, State> {
  public override state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, info: ErrorInfo): void {
    reportClientError(error, {
      componentStack: info.componentStack,
      module: this.props.module,
    });
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <ErrorState
            title={translateAppParams('errors.module.title', 'en')}
            description={
              this.state.error?.message ||
              translateAppParams('errors.module.description', 'en')
            }
            onRetry={this.handleRetry}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
