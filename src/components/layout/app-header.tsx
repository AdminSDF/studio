
'use client';
import { CONFIG } from '@/lib/constants';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

const getPageTitle = (pathname: string): string => {
  if (pathname.includes('/mining')) return 'Tap to Earn Crypto';
  if (pathname.includes('/boosters')) return 'Supercharge Your Earnings';
  if (pathname.includes('/redeem')) return 'Cash Out Your Coins';
  if (pathname.includes('/transactions')) return 'Activity Log';
  if (pathname.includes('/profile')) return 'Account & Settings';
  return `Welcome to ${CONFIG.APP_NAME}`;
};

export function AppHeader() {
  const pathname = usePathname();
  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);

  return (
    <header className="bg-card text-foreground p-4 text-center border-b border-border flex-shrink-0 sticky top-0 z-50 shadow-sm">
      <h1 className="text-2xl font-bold text-primary">{CONFIG.APP_NAME}</h1>
      <p className="text-sm text-muted-foreground">{pageTitle}</p>
    </header>
  );
}
