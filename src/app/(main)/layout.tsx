'use client';
import type { ReactNode } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { MarqueeBar } from '@/components/layout/marquee-bar';
import { AppNavbar } from '@/components/layout/app-navbar';
import { AppFooter } from '@/components/layout/app-footer';
import { ConnectionStatusIndicator } from '@/components/shared/connection-status-indicator';
import { DailyBonusModal } from '@/components/shared/daily-bonus-modal';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function MainAppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <Skeleton className="h-16 w-full" /> {/* Header Placeholder */}
          <Skeleton className="h-8 w-full" /> {/* Marquee Placeholder */}
          <div className="flex-grow p-4 space-y-4"> {/* Content Placeholder */}
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <Skeleton className="h-16 w-full" /> {/* Navbar Placeholder */}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <MarqueeBar />
      <main className="flex-grow overflow-y-auto bg-background">
        {children}
      </main>
      <ConnectionStatusIndicator />
      <DailyBonusModal />
      <AppNavbar />
      <AppFooter />
    </div>
  );
}
