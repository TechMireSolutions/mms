import React from "react";
import type { StandardMessagingRecipient as MessagingRecipient } from "@mms/shared";
import { Card } from "@/components/ui/card";
import { DetailSectionTitle } from "@/components/ui/DetailSectionTitle";
import { useTranslation } from "@/hooks/useTranslation";
import {
  StudentRelationshipCard,
  type StudentRelationshipCardData,
} from "@/tenant/features/students/components/StudentRelationshipCard";

interface StudentDetailRelationsSectionProps {
  relationships: StudentRelationshipCardData[];
  canMessage?: boolean;
  openComposer?: (channel: "sms" | "whatsapp" | "email", recipients: MessagingRecipient[]) => void;
  onNavigateToContact?: (contactId: string | number) => void;
}

export function StudentDetailRelationsSection({
  relationships,
  canMessage = true,
  openComposer,
  onNavigateToContact,
}: StudentDetailRelationsSectionProps): React.JSX.Element | null {
  const { t } = useTranslation();

  if (relationships.length === 0) return null;

  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center justify-between">
        <DetailSectionTitle>
          {t("students.detail.allRelationships")} ({relationships.length})
        </DetailSectionTitle>
      </div>

      <Card accentColor="info" className="divide-y divide-border/50 p-0 overflow-hidden">
        {relationships.map((rel) => (
          <StudentRelationshipCard
            key={rel.key}
            relationship={rel}
            canMessage={canMessage}
            openComposer={openComposer}
            onNavigateToContact={onNavigateToContact}
          />
        ))}
      </Card>
    </div>
  );
}
