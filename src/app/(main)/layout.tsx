
'use client';
import type { ReactNode } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { MarqueeBar } from '@/components/layout/marquee-bar';
import { AppNavbar } from '@/components/layout/app-navbar';
// import { AppFooter } from '@/components/layout/app-footer';
import { ConnectionStatusIndicator } from '@/components/shared/connection-status-indicator';
import { DailyBonusModal } from '@/components/shared/daily-bonus-modal';
import { OfflineEarningsModal } from '@/components/shared/offline-earnings-modal'; // Import new modal
import { useAuth } from '@/components/providers/auth-provider';
import { useAppState } from '@/components/providers/app-state-provider'; // Import useAppState
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { CONFIG } from '@/lib/constants';

export default function MainAppLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { 
    userData, 
    loadingUserData, 
    showOfflineEarningsModal, 
    offlineEarnedAmount, 
    closeOfflineEarningsModal,
    updateUserFirestoreData, // For updating lastEnergyUpdate from modal
    addTransaction // For adding offline earnings transaction
  } = useAppState();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const handleClaimOfflineEarnings = async () => {
    if (userData && user && offlineEarnedAmount > 0) {
      await updateUserFirestoreData({ 
        balance: (userData.balance || 0) + offlineEarnedAmount,
        lastEnergyUpdate: new Date() // Reset the clock
      });
      await addTransaction({
        amount: offlineEarnedAmount,
        type: 'offline_earnings',
        status: 'completed',
        details: `Earned ${offlineEarnedAmount} ${CONFIG.COIN_SYMBOL} while offline.`,
      });
    }
    closeOfflineEarningsModal();
  };


  if (authLoading || (!userData && loadingUserData)) { // Show skeleton if auth is loading OR if user not yet loaded and app state is loading user data
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-20 w-full rounded-lg" /> {/* Header Placeholder */}
          <Skeleton className="h-8 w-full rounded-md" /> {/* Marquee Placeholder */}
          <div className="flex-grow p-4 space-y-4"> {/* Content Placeholder */}
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
          <Skeleton className="h-16 w-full rounded-lg" /> {/* Navbar Placeholder */}
        </div>
      </div>
    );
  }
  
  if (!user) { // If auth is done, but no user, means they should be redirected. This prevents main layout flash.
    return null; // Or a minimal loading/redirecting message
  }


  return (
    <div className="flex flex-col min-h-screen bg-secondary/30">
      <AppHeader />
      <MarqueeBar />
      <main className="flex-grow overflow-y-auto bg-background">
        {children}
      </main>
      <ConnectionStatusIndicator />
      <DailyBonusModal />
      <OfflineEarningsModal
        isOpen={showOfflineEarningsModal}
        earnedAmount={offlineEarnedAmount}
        onClaim={handleClaimOfflineEarnings} // Use onClaim to handle logic
      />
      <AppNavbar />
      {/* <AppFooter /> */}
    </div>
  );
}
