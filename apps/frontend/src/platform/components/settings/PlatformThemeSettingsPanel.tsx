import React, { useState } from 'react';
import { Palette, Sun, Moon, Monitor, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ThemeMode } from '@mms/shared';

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { mode: 'light', label: 'Light', icon: Sun },
  { mode: 'dark', label: 'Dark', icon: Moon },
  { mode: 'system', label: 'System', icon: Monitor },
];

const ACCENTS = [
  { name: 'Emerald', class: 'bg-emerald-600', ring: 'ring-emerald-500' },
  { name: 'Indigo', class: 'bg-indigo-600', ring: 'ring-indigo-500' },
  { name: 'Sky', class: 'bg-sky-600', ring: 'ring-sky-500' },
  { name: 'Violet', class: 'bg-violet-600', ring: 'ring-violet-500' },
  { name: 'Amber', class: 'bg-amber-600', ring: 'ring-amber-500' },
];

export function PlatformThemeSettingsPanel(): React.JSX.Element {
  const [selectedMode, setSelectedMode] = useState<ThemeMode>('system');
  const [selectedAccent, setSelectedAccent] = useState('Emerald');

  const handleModeChange = (mode: ThemeMode) => {
    setSelectedMode(mode);
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (mode === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    }
  };

  return (
    <div className="space-y-6 text-start">
      <Card className="rounded-xl border-border/60 shadow-xs">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            Display Appearance
          </CardTitle>
          <CardDescription className="text-xs">
            Choose your preferred color theme and visual mode for the Platform Apex console.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedMode === opt.mode;
              return (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => handleModeChange(opt.mode)}
                  className={cn(
                    'flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer',
                    isSelected
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20 font-semibold text-primary'
                      : 'border-border/60 hover:bg-muted/40 text-muted-foreground',
                  )}
                  aria-pressed={isSelected}
                >
                  <Icon className="w-6 h-6 mb-2" />
                  <span className="text-xs">{opt.label}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-3 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Console Accent Palette</span>
              <Badge variant="outline" className="text-3xs font-mono">{selectedAccent}</Badge>
            </div>
            <div className="flex items-center gap-3">
              {ACCENTS.map((accent) => (
                <button
                  key={accent.name}
                  type="button"
                  onClick={() => setSelectedAccent(accent.name)}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer',
                    accent.class,
                    selectedAccent === accent.name && `ring-2 ring-offset-2 ${accent.ring}`,
                  )}
                  aria-label={`Select ${accent.name} accent`}
                >
                  {selectedAccent === accent.name && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
