
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
      // Removed max-w-[500px], mx-auto, border-l, border-r, border-border, shadow-2xl
      'overflow-x-hidden', // Keep to prevent horizontal scroll from odd content
      'flex flex-col flex-grow w-full', // Ensure it takes full width and flex properties
      activeTheme.cssClass, // Apply the theme CSS class itself (e.g., 'theme-crimson-fire')
      'bg-background text-foreground' // Explicitly apply themed background and foreground here
    )}>
      {children}
    </div>
  );
}
