import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: SimplePaginationProps): React.JSX.Element | null {
  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Button
        variant="outline"
        size="icon"
        className="h-7 w-7 rounded-md border-border/60 hover:bg-background/80 transition-colors shadow-none cursor-pointer"
        disabled={currentPage === 1}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-[11px] font-bold text-muted-foreground select-none">
        {currentPage} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="h-7 w-7 rounded-md border-border/60 hover:bg-background/80 transition-colors shadow-none cursor-pointer"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
