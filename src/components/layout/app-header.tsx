'use client';
import { CONFIG } from '@/lib/constants';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

const getPageTitle = (pathname: string): string => {
  if (pathname.includes('/mining')) return 'Tap to Earn Cryptocurrency';
  if (pathname.includes('/boosters')) return 'Boosters & Upgrades';
  if (pathname.includes('/redeem')) return 'Redeem Your Earnings';
  if (pathname.includes('/transactions')) return 'Transaction History';
  if (pathname.includes('/profile')) return 'Your Profile';
  return CONFIG.APP_NAME;
};

export function AppHeader() {
  const pathname = usePathname();
  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);

  return (
    <header className="bg-primary text-primary-foreground p-4 text-center border-b-4 border-accent flex-shrink-0 sticky top-0 z-40">
      <h1 className="text-2xl font-bold">{CONFIG.APP_NAME}</h1>
      <p className="text-sm opacity-90">{pageTitle}</p>
    </header>
  );
}
