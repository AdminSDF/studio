
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppState } from '@/components/providers/app-state-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CONFIG } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import { Zap, Target, Info, AlertTriangle, Wallet, TrendingUp, CreditCard, Wifi, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdContainer } from '@/components/shared/ad-container';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/providers/auth-provider';
import { PersonalizedTipDisplay } from '@/components/shared/personalized-tip-display';

// Helper to show floating tap value
function showFloatingTapValue(amount: number, coinElementId: string) {
  const coinContainer = document.getElementById(coinElementId)?.parentElement;
  if (!coinContainer) return;

  const floatEl = document.createElement('div');
  floatEl.className = 'floating-tap-value absolute top-1/2 left-1/2 pointer-events-none text-2xl font-bold text-accent animate-floatUp z-10';
  floatEl.textContent = `+${formatNumber(amount, 2)}`;
  coinContainer.appendChild(floatEl);
  setTimeout(() => {
    if (coinContainer.contains(floatEl)) {
      coinContainer.removeChild(floatEl);
    }
  }, 950);
}


export default function MiningPage() {
  const { userData, updateUserFirestoreData, updateEnergy, isOnline } = useAppState();
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const [energyRegenTimerText, setEnergyRegenTimerText] = useState("Calculating...");
  const [tapCountForAd, setTapCountForAd] = useState(0);
  const [triggerAd, setTriggerAd] = useState(false);
  const sdfCoinLogoUrl = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgfE9IHbZO-d0lFy6S3f_ks7gG4Wq47ohPp45dVEssDRApAIvwVv6r8CleAyjiHOAwY8aGhdELKU4xjx0nO9w6IYuwMOryi13qE5wqzsZnFDn8ZwrSd99BlrZuDiugDiwFZ5n0usxjeNeR_I7BUTc9t4r0beiwLfKfUPhAbXPhi8VVO3MWW56bydGdxH7M/s320/file_0000000026446230b5372bc60dd219f3%20%281%29.png";

  const [showTapHint, setShowTapHint] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_TIMEOUT = 5000; // 5 seconds

  const userDataRef = useRef(userData);
  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);

  const isOnlineRef = useRef(isOnline);
  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  // Energy Regeneration Logic
  useEffect(() => {
    if (!userData || !isOnline) return;

    const intervalId = setInterval(() => {
      const now = new Date();
      const lastUpdate = userData.lastEnergyUpdate ? new Date(userData.lastEnergyUpdate as any) : now;
      const secondsPassed = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);

      let newEnergy = userData.currentEnergy;
      if (secondsPassed > 0 && userData.currentEnergy < userData.maxEnergy) {
        const energyGained = secondsPassed * CONFIG.ENERGY_REGEN_RATE_PER_SECOND;
        newEnergy = Math.min(userData.maxEnergy, userData.currentEnergy + energyGained);

        updateEnergy(newEnergy, now);

        updateUserFirestoreData({ currentEnergy: newEnergy, lastEnergyUpdate: now }).catch(error => {
          console.error("Error saving energy update:", error);
        });
      } else if (userData.currentEnergy >= userData.maxEnergy) {
        if (now.getTime() - lastUpdate.getTime() > 5 * 60 * 1000) {
            updateUserFirestoreData({ lastEnergyUpdate: now });
        }
      }

      if (newEnergy >= userData.maxEnergy) {
        setEnergyRegenTimerText("⚡ Energy Full!");
      } else {
        const currentRegenRate = CONFIG.ENERGY_REGEN_RATE_PER_SECOND;
        const timeToNextEnergyPoint = currentRegenRate > 0 ? Math.ceil(1 / currentRegenRate) : Infinity;
        const energyToFull = userData.maxEnergy - newEnergy;
        const timeToFullSeconds = currentRegenRate > 0 ? Math.ceil(energyToFull / currentRegenRate) : Infinity;

        let timerText = `+1 in ~${timeToNextEnergyPoint}s. `;
        if (timeToFullSeconds < Infinity && timeToFullSeconds > 0 && timeToFullSeconds <= 3600 * 2) { // Up to 2 hours
          const hours = Math.floor(timeToFullSeconds / 3600);
          const minutes = Math.floor((timeToFullSeconds % 3600) / 60);
          const seconds = timeToFullSeconds % 60;
          timerText += `Full in ${hours > 0 ? hours + 'h ' : ''}${minutes > 0 ? minutes + 'm ' : ''}${seconds}s.`;
        } else if (timeToFullSeconds > 3600 * 2) {
          timerText += `Full in >2hrs.`;
        }
        setEnergyRegenTimerText(timerText);
      }

    }, 1000);

    return () => clearInterval(intervalId);
  }, [userData, updateUserFirestoreData, updateEnergy, isOnline]);

  // Cleanup for inactivity timer
  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);


  const handleTap = useCallback(async () => {
    if (!isOnline) {
      toast({ title: 'Offline', description: 'You are offline. Connect to mine.', variant: 'destructive' });
      return;
    }
    if (!userData) return;

    if (userData.currentEnergy < 1) {
      toast({ title: 'No Energy!', description: 'Not enough energy! Wait for it to recharge.', variant: 'destructive' });
      return;
    }

    // Tap Hint Logic: Clear timer and hide hint on tap
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    setShowTapHint(false);

    const coinsMined = userData.tapPower;

    const coinElement = document.getElementById('tap-coin');
    if (coinElement) {
      showFloatingTapValue(coinsMined, 'tap-coin');
    }

    const newTapCountForAd = tapCountForAd + 1;
    setTapCountForAd(newTapCountForAd);
    if (newTapCountForAd % CONFIG.MAX_TAPS_BEFORE_AD_CHECK === 0) {
      setTriggerAd(prev => !prev);
    }

    const today = new Date().toDateString();
    const newTapCountToday = userData.lastTapDate === today ? userData.tapCountToday + 1 : 1;

    const newEnergyAfterTap = userData.currentEnergy -1;
    updateEnergy(newEnergyAfterTap, new Date());

    try {
      await updateUserFirestoreData({
        balance: (userData.balance || 0) + coinsMined,
        tapCountToday: newTapCountToday,
        lastTapDate: today,
        currentEnergy: newEnergyAfterTap,
        lastEnergyUpdate: new Date()
      });
    } catch (error) {
      console.error('Error saving tap:', error);
      toast({ title: 'Sync Error', description: 'Failed to save mining data.', variant: 'destructive' });
    }

    // Tap Hint Logic: Set new timer for inactivity
    inactivityTimerRef.current = setTimeout(() => {
        if (userDataRef.current && userDataRef.current.currentEnergy >= 1 && isOnlineRef.current) {
            setShowTapHint(true);
        }
    }, INACTIVITY_TIMEOUT);

  }, [isOnline, userData, updateUserFirestoreData, updateEnergy, toast, tapCountForAd, INACTIVITY_TIMEOUT]);

  if (!userData) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-[120px] w-full max-w-sm mx-auto rounded-xl" /> {/* Wallet Card Skeleton */}
        <Skeleton className="h-64 w-64 mx-auto rounded-full" /> {/* Tap Button with Circular Progress Skeleton */}
        <Skeleton className="h-5 w-1/2 mx-auto mt-2 rounded-md" /> {/* Energy Timer Text Skeleton */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const energyPercent = userData.maxEnergy > 0 ? (userData.currentEnergy / userData.maxEnergy) * 100 : 0;
  const balanceInrValue = userData.balance * CONFIG.CONVERSION_RATE;
  const remainingToRedeem = Math.max(0, CONFIG.MIN_REDEEM - userData.balance);

  // Circular progress calculation
  const circleRadius = 120; // Radius of the progress circle path
  const circleStrokeWidth = 12; // Stroke width of the progress circle
  const circleDiameter = (circleRadius + circleStrokeWidth) * 2;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference * (1 - energyPercent / 100);


  return (
    <div className="p-4 md:p-6 space-y-6 pb-20">
      <Card className="w-full max-w-sm mx-auto shadow-xl border-primary/30 rounded-xl bg-gradient-to-br from-card to-secondary/20">
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="text-xl font-semibold text-primary flex items-center">
            <Coins className="mr-2.5 h-6 w-6 text-accent" />
            Your Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-4xl font-bold text-foreground">
            {formatNumber(userData.balance)} <span className="text-2xl opacity-80">{CONFIG.COIN_SYMBOL}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            ≈ ₹{formatNumber(balanceInrValue)}
          </p>
        </CardContent>
      </Card>

      {/* Tap Button with Circular Energy Progress */}
      <div className="flex flex-col items-center my-8 relative" id="coin-container">
        {/* Tap Here Hint */}
        {showTapHint && isOnline && userData && userData.currentEnergy >= 1 && (
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[calc(100%_+_30px)] 
                       px-3 py-1.5 bg-accent text-accent-foreground text-xs font-semibold rounded-md shadow-lg
                       animate-bounce z-20 pointer-events-none"
          >
            Tap Here!
            <div
              className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0
                         border-l-[6px] border-l-transparent
                         border-r-[6px] border-r-transparent
                         border-t-[6px] border-t-accent"
            />
          </div>
        )}

        {/* Circular Progress SVG */}
        <div className="relative w-[256px] h-[256px] flex items-center justify-center mb-3"> {/* Container for SVG and Button, slightly larger than button */}
          <svg width={circleDiameter} height={circleDiameter} viewBox={`0 0 ${circleDiameter} ${circleDiameter}`} className="absolute inset-0 transform -rotate-90">
            {/* Background Circle (Track) */}
            <circle
              cx={circleDiameter / 2}
              cy={circleDiameter / 2}
              r={circleRadius}
              strokeWidth={circleStrokeWidth}
              className="stroke-muted/50 fill-transparent"
            />
            {/* Foreground Circle (Progress) */}
            <circle
              cx={circleDiameter / 2}
              cy={circleDiameter / 2}
              r={circleRadius}
              strokeWidth={circleStrokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="stroke-primary fill-transparent transition-all duration-300 ease-linear"
              strokeLinecap="round"
            />
          </svg>
          {/* Tap Button - Centered within the SVG container */}
          <Button
            id="tap-coin"
            variant="default"
            onClick={handleTap}
            className="relative w-56 h-56 rounded-full bg-foreground animate-neon-glow active:scale-95 transition-transform duration-150 flex items-center justify-center focus-visible:ring-4 focus-visible:ring-primary/50 group"
            aria-label={`Tap to mine ${CONFIG.COIN_SYMBOL}`}
            disabled={!isOnline || userData.currentEnergy < 1}
          >
            <Image
              src={sdfCoinLogoUrl}
              alt={`${CONFIG.COIN_SYMBOL} Coin`}
              width={210}
              height={210}
              className="rounded-full pointer-events-none absolute opacity-90 group-hover:opacity-100 transition-opacity object-contain"
              priority
              data-ai-hint="coin logo"
            />
          </Button>
        </div>
        {/* Energy Information Text */}
        <div className="text-center mt-2">
            <p className="text-lg font-semibold text-foreground">
                <Zap className="inline-block mr-1.5 h-5 w-5 text-accent align-text-bottom" />
                {formatNumber(userData.currentEnergy, 0)} / {formatNumber(userData.maxEnergy, 0)}
            </p>
            <p className="text-xs text-muted-foreground">{energyRegenTimerText}</p>
        </div>
      </div>


      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center shadow-md rounded-xl border-border">
          <CardHeader className="pb-2 pt-4"><CardTitle className="text-base flex items-center justify-center text-muted-foreground"><Target className="mr-2 text-primary h-5 w-5" />Taps Today</CardTitle></CardHeader>
          <CardContent className="pt-0 pb-4"><p className="text-3xl font-bold text-foreground">{formatNumber(userData.tapCountToday, 0)}</p></CardContent>
        </Card>
        <Card className="text-center shadow-md rounded-xl border-border">
          <CardHeader className="pb-2 pt-4"><CardTitle className="text-base flex items-center justify-center text-muted-foreground"><TrendingUp className="mr-2 text-primary h-5 w-5" />Tap Power</CardTitle></CardHeader>
          <CardContent className="pt-0 pb-4"><p className="text-3xl font-bold text-foreground">{formatNumber(userData.tapPower)} <span className="text-sm text-muted-foreground">{CONFIG.COIN_SYMBOL}</span></p></CardContent>
        </Card>
      </div>

      <Card className="shadow-md rounded-xl border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center font-semibold"><Info className="mr-2 text-primary h-5 w-5" />Redeem Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm">Minimum redeem: <strong className="text-primary">{CONFIG.MIN_REDEEM} {CONFIG.COIN_SYMBOL}</strong></p>
          {remainingToRedeem > 0 ? (
            <p className="text-sm text-destructive flex items-center"><AlertTriangle className="h-4 w-4 mr-1.5 flex-shrink-0"/>You need {formatNumber(remainingToRedeem)} more {CONFIG.COIN_SYMBOL} to redeem.</p>
          ) : (
            <p className="text-sm text-success font-semibold flex items-center">🎉 You can now redeem your coins!</p>
          )}
        </CardContent>
      </Card>

      <PersonalizedTipDisplay />
      <AdContainer pageContext="mining" trigger={triggerAd} />

    </div>
  );
}
    

    

    

    

    