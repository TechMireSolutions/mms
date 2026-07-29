import React from 'react';
import { Mail, MessageSquare, MessageCircle } from 'lucide-react';
import { getChannelBadgeStyle, getChannelLabelKey } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';

export interface ChannelBadgeProps {
  channel: 'sms' | 'whatsapp' | 'email' | string;
  className?: string;
  showIcon?: boolean;
}

/**
 * Reusable ChannelBadge primitive displaying normalized channel style and localized label.
 */
export function ChannelBadge({
  channel,
  className = '',
  showIcon = true,
}: ChannelBadgeProps): React.JSX.Element {
  const { t } = useTranslation();

  const Icon = channel === 'email' ? Mail : channel === 'sms' ? MessageSquare : MessageCircle;
  const labelKey = getChannelLabelKey(channel);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-black uppercase ${getChannelBadgeStyle(
        channel
      )} ${className}`}
    >
      {showIcon && <Icon className="w-3 h-3 flex-shrink-0" />}
      {t(labelKey)}
    </span>
  );
}

export default ChannelBadge;
