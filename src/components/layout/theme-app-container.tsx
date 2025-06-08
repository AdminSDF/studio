
'use client';

import type { ReactNode } from 'react';
import { useAppState } from '@/components/providers/app-state-provider';
import { CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function ThemeAppContainer({ children }: { children: ReactNode }) {
  const { userData, loadingUserData } = useAppState();

  // Determine active theme, default to first theme if userData or activeTheme is not available
  // or if still loading.
  const activeTheme = (!loadingUserData && userData?.activeTheme)
    ? CONFIG.APP_THEMES.find(t => t.id === userData.activeTheme) || CONFIG.APP_THEMES[0]
    : CONFIG.APP_THEMES[0];

  return (
    <div className={cn(
      // These classes define the main app container style (max-width, layout, etc.)
      'max-w-[500px] mx-auto border-l border-r border-border shadow-2xl overflow-x-hidden',
      'flex flex-col flex-grow', // Ensures it takes available vertical space if body is flex
      activeTheme.cssClass, // Apply the theme CSS class itself (e.g., 'theme-crimson-fire')
      'bg-background text-foreground' // Explicitly apply themed background and foreground here
    )}>
      {children}
    </div>
  );
}
