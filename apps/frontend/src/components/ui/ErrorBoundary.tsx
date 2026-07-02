import React, { Component, ErrorInfo, ReactNode } from "react";
import { ErrorState } from "@/components/ui/ErrorState";
import { reportClientError } from "@/lib/clientErrorReporting";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component that catches runtime errors in child components
 * and displays a fallback user interface instead of crashing the application.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    reportClientError(error, { componentStack: errorInfo.componentStack });
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-6 bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl shadow-sm my-4">
          <ErrorState
            title="Component Rendering Failure"
            description={this.state.error?.message || "An unexpected error occurred while rendering this interface component."}
            onRetry={this.handleRetry}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
