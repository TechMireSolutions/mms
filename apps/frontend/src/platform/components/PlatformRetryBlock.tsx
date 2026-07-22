import React from "react";
import { Loader2 } from "lucide-react";
import { PlatformAlert } from "@/platform/components/PlatformAlert";
import { Button } from "@/components/ui/button";

interface PlatformRetryBlockProps {
  errorText: string;
  retryText: string;
  isFetching?: boolean;
  onRetry: () => void;
}

/**
 * Common block for failed API/list fetch requests with a retry button.
 */
export default function PlatformRetryBlock({
  errorText,
  retryText,
  isFetching = false,
  onRetry,
}: PlatformRetryBlockProps): React.JSX.Element {
  return (
    <PlatformAlert
      variant="destructiveBlock"
      message={
        <>
          <p className="text-sm text-destructive">{errorText}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isFetching}
            onClick={onRetry}
            className="text-primary"
          >
            {isFetching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin me-1" aria-hidden="true" />
            ) : null}
            {retryText}
          </Button>
        </>
      }
    />
  );
}
