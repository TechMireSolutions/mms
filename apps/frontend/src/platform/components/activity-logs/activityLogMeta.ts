import { SEMANTIC_BADGE } from '@/lib/semanticTone';
import {
  Trash2,
  PlusCircle,
  RefreshCw,
  Key,
  Settings,
  Terminal,
} from 'lucide-react';
import type React from 'react';

export type LogCategory = 'all' | 'auth' | 'workspace' | 'system' | 'admin';

export function getActionCategory(action: string): LogCategory {
  const a = action.toLowerCase();
  if (a.includes('login') || a.includes('auth') || a.includes('password')) return 'auth';
  if (a.includes('workspace') || a.includes('onboard') || a.includes('enable') || a.includes('disable')) return 'workspace';
  if (a.includes('migrate') || a.includes('restart') || a.includes('reset') || a.includes('setting')) return 'system';
  if (a.includes('admin') || a.includes('user') || a.includes('permission')) return 'admin';
  return 'system';
}

export function getActionMeta(action: string): { tone: string; Icon: React.ElementType } {
  if (action.includes('delete') || action.includes('disable') || action.includes('purge') || action.includes('reset')) {
    return { tone: SEMANTIC_BADGE.destructive, Icon: Trash2 };
  }
  if (action.includes('create') || action.includes('enable') || action.includes('onboard')) {
    return { tone: SEMANTIC_BADGE.success, Icon: PlusCircle };
  }
  if (action.includes('migrate') || action.includes('restart') || action.includes('reload')) {
    return { tone: SEMANTIC_BADGE.info, Icon: RefreshCw };
  }
  if (action.includes('login') || action.includes('auth') || action.includes('password')) {
    return { tone: SEMANTIC_BADGE.warning, Icon: Key };
  }
  if (action.includes('setting') || action.includes('config') || action.includes('update')) {
    return { tone: SEMANTIC_BADGE.primary, Icon: Settings };
  }
  return { tone: SEMANTIC_BADGE.primary, Icon: Terminal };
}
