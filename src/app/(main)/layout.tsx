
'use client';
import type { ReactNode } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { MarqueeBar } from '@/components/layout/marquee-bar';
import { AppNavbar } from '@/components/layout/app-navbar';
// import { AppFooter } from '@/components/layout/app-footer';
import { ConnectionStatusIndicator } from '@/components/shared/connection-status-indicator';
import { DailyBonusModal } from '@/components/shared/daily-bonus-modal';
import { OfflineEarningsModal } from '@/components/shared/offline-earnings-modal';
import { useAuth } from '@/components/providers/auth-provider';
import { useAppState } from '@/components/providers/app-state-provider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react'; 
import { Skeleton } from '@/components/ui/skeleton';
import { CONFIG } from '@/lib/constants';
import { AdContainer } from '@/components/shared/ad-container'; 

export default function MainAppLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { 
    userData, 
    loadingUserData, 
    showOfflineEarningsModal, 
    offlineEarnedAmount, 
    closeOfflineEarningsModal,
    updateUserFirestoreData,
    addTransaction
  } = useAppState();
  const router = useRouter();
  const [marqueeAdTrigger, setMarqueeAdTrigger] = useState(true); 

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const handleClaimOfflineEarnings = async () => {
    if (userData && user && offlineEarnedAmount > 0) {
      await updateUserFirestoreData({ 
        balance: (userData.balance || 0) + offlineEarnedAmount,
        lastEnergyUpdate: new Date() 
      });
      await addTransaction({
        amount: offlineEarnedAmount,
        type: 'offline_earnings',
        status: 'completed',
        details: `Earned ${offlineEarnedAmount} ${CONFIG.COIN_SYMBOL} while offline.`,
      });
    }
    closeOfflineEarningsModal();
    setMarqueeAdTrigger(prev => !prev); 
  };


  if (authLoading || (!userData && loadingUserData)) { 
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="w-full max-w-md space-y-3 sm:space-y-4">
          <Skeleton className="h-16 sm:h-20 w-full rounded-lg" /> 
          <Skeleton className="h-6 sm:h-8 w-full rounded-md" /> 
          <Skeleton className="h-8 sm:h-10 w-full rounded-md" /> {/* Placeholder for marquee ad */}
          <div className="flex-grow p-2 sm:p-4 space-y-3 sm:space-y-4"> 
            <Skeleton className="h-28 sm:h-32 w-full rounded-lg" />
            <Skeleton className="h-32 sm:h-40 w-full rounded-lg" />
            <Skeleton className="h-16 sm:h-20 w-full rounded-lg" />
          </div>
          <Skeleton className="h-14 sm:h-16 w-full rounded-lg" /> 
        </div>
      </div>
    );
  }
  
  if (!user) { 
    return null; 
  }


  return (
    <div className="flex flex-col min-h-screen bg-secondary/30">
      <AppHeader />
      <MarqueeBar />
      {/* Ad Container below Marquee Bar */}
      <div className="w-full my-1 sm:my-2">
        <AdContainer pageContext="layout_marquee" trigger={marqueeAdTrigger} />
      </div>
      <main className="flex-grow overflow-y-auto bg-background">
        {children}
      </main>
      <ConnectionStatusIndicator />
      <DailyBonusModal />
      <OfflineEarningsModal
        isOpen={showOfflineEarningsModal}
        earnedAmount={offlineEarnedAmount}
        onClaim={handleClaimOfflineEarnings}
      />
      <AppNavbar />
    </div>
  );
}
