import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

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
  const { t } = useTranslation();
  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Button
        variant="outline"
        size="icon"
        className="rounded-md border-border/60 hover:bg-background/80 transition-colors shadow-none cursor-pointer"
        disabled={currentPage === 1}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        aria-label={t("pagination.previousAria")}
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
      </Button>
      <span className="text-xs font-bold text-muted-foreground select-none">
        {currentPage} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="rounded-md border-border/60 hover:bg-background/80 transition-colors shadow-none cursor-pointer"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        aria-label={t("pagination.nextAria")}
      >
        <ChevronRight className="h-4 w-4 rtl:rotate-180" />
      </Button>
    </div>
  );
}
