
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
import { cn } from '@/lib/utils';

// Helper to show floating tap value
function showFloatingTapValue(amount: number, coinElementId: string) {
  const coinContainer = document.getElementById(coinElementId)?.parentElement;
  if (!coinContainer) return;

  const floatEl = document.createElement('div');
  floatEl.className = 'floating-tap-value absolute top-1/2 left-1/2 pointer-events-none text-lg md:text-xl font-bold text-accent animate-floatUp z-10'; // Adjusted text size
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
  const [bottomAdTrigger, setBottomAdTrigger] = useState(true);
  const [middleAdTrigger, setMiddleAdTrigger] = useState(true);
  const sdfCoinLogoUrl = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgfE9IHbZO-d0lFy6S3f_ks7gG4Wq47ohPp45dVEssDRApAIvwVv6r8CleAyjiHOAwY8aGhdELKU4xjx0nO9w6IYuwMOryi13qE5wqzsZnFDn8ZwrSd99BlrZuDiugDiwFZ5n0usxjeNeR_I7BUTc9t4r0beiwLfKfUPhAbXPhi8VVO3MWW56bydGdxH7M/s320/file_0000000026446230b5372bc60dd219f3%20%281%29.png";

  const [showTapHint, setShowTapHint] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_TIMEOUT = 5000; 

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
        if (timeToFullSeconds < Infinity && timeToFullSeconds > 0 && timeToFullSeconds <= 3600 * 2) { 
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
      setBottomAdTrigger(prev => !prev);
      if (newTapCountForAd % (CONFIG.MAX_TAPS_BEFORE_AD_CHECK * 2) === 0) {
          setMiddleAdTrigger(prev => !prev);
      }
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

    inactivityTimerRef.current = setTimeout(() => {
        if (userDataRef.current && userDataRef.current.currentEnergy >= 1 && isOnlineRef.current) {
            setShowTapHint(true);
        }
    }, INACTIVITY_TIMEOUT);

  }, [isOnline, userData, updateUserFirestoreData, updateEnergy, toast, tapCountForAd, INACTIVITY_TIMEOUT]);

  if (!userData) {
    return (
      <div className="p-2 sm:p-3 md:p-4 space-y-3 sm:space-y-4">
        <Skeleton className="h-[80px] sm:h-[100px] w-full max-w-xs mx-auto rounded-xl" /> 
        <Skeleton className="h-36 w-36 sm:h-40 sm:w-40 md:h-48 md:w-48 mx-auto rounded-full" /> 
        <Skeleton className="h-4 w-1/2 mx-auto mt-1 rounded-md" /> 
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-2 sm:mt-3">
          <Skeleton className="h-16 sm:h-20 w-full rounded-xl" />
          <Skeleton className="h-16 sm:h-20 w-full rounded-xl" />
        </div>
        <Skeleton className="h-12 sm:h-16 w-full rounded-xl" />
        <Skeleton className="h-12 sm:h-16 w-full rounded-xl" />
      </div>
    );
  }

  const energyPercent = userData.maxEnergy > 0 ? (userData.currentEnergy / userData.maxEnergy) * 100 : 0;
  const balanceInrValue = userData.balance * CONFIG.CONVERSION_RATE;
  const remainingToRedeem = Math.max(0, CONFIG.MIN_REDEEM - userData.balance);

  const circleRadius = 70; // Base mobile size
  const mdCircleRadius = 90; // Medium screen size
  const circleStrokeWidth = 8; // Base mobile
  const mdCircleStrokeWidth = 10; // Medium screen
  
  // Dynamic sizing for SVG container based on viewport (CSS handles actual SVG scaling for sharpness)
  const svgContainerSizeClass = "w-[160px] h-[160px] md:w-[200px] md:h-[200px]";
  const tapButtonSizeClass = "w-36 h-36 md:w-44 md:h-44";
  const tapButtonImageSize = 140; // Mobile
  const mdTapButtonImageSize = 160; // Desktop


  return (
    <>
      <div className="p-2 sm:p-3 md:p-4 space-y-3 sm:space-y-4 pb-16"> 
        <Card className="w-full max-w-xs mx-auto shadow-lg border-primary/20 rounded-xl bg-gradient-to-br from-card to-secondary/10">
          <CardHeader className="pb-1.5 pt-2.5 px-3 sm:pb-2 sm:pt-3 sm:px-4"> {/* Adjusted padding */}
            <CardTitle className="text-base sm:text-lg font-semibold text-primary flex items-center"> {/* Adjusted font size */}
              <Coins className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 text-accent" /> {/* Adjusted icon size */}
              Your Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0.5 px-3 pb-2.5 sm:px-4 sm:pb-3"> {/* Adjusted padding */}
            <div className="text-2xl sm:text-3xl font-bold text-foreground"> {/* Adjusted font size */}
              {formatNumber(userData.balance)} <span className="text-lg sm:text-xl opacity-80">{CONFIG.COIN_SYMBOL}</span>
            </div>
            <p className="text-xs sm:text-xs text-muted-foreground"> {/* Adjusted font size */}
              ≈ ₹{formatNumber(balanceInrValue)}
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center my-3 sm:my-4 relative" id="coin-container"> {/* Adjusted margin */}
          {showTapHint && isOnline && userData && userData.currentEnergy >= 1 && (
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[calc(100%_+_15px)] 
                        px-2 py-0.5 sm:px-2.5 sm:py-1 bg-accent text-accent-foreground text-[10px] sm:text-xs font-semibold rounded-md shadow-lg
                        animate-bounce z-20 pointer-events-none"
            >
              Tap Here!
              <div
                className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0
                          border-l-[4px] sm:border-l-[5px] border-l-transparent
                          border-r-[4px] sm:border-r-[5px] border-r-transparent
                          border-t-[4px] sm:border-t-[5px] border-t-accent"
              />
            </div>
          )}

          <div className={cn("relative flex items-center justify-center mb-1.5 sm:mb-2", svgContainerSizeClass)}> 
             <svg 
              width="100%" 
              height="100%" 
              viewBox={`0 0 ${(mdCircleRadius + mdCircleStrokeWidth) * 2} ${(mdCircleRadius + mdCircleStrokeWidth) * 2}`} // Use larger viewBox for scaling
              className="absolute inset-0 transform -rotate-90"
            >
              <circle
                cx={(mdCircleRadius + mdCircleStrokeWidth)}
                cy={(mdCircleRadius + mdCircleStrokeWidth)}
                r={mdCircleRadius}
                strokeWidth={mdCircleStrokeWidth}
                className="stroke-muted/30 md:stroke-muted/40 fill-transparent"
              />
              <circle
                cx={(mdCircleRadius + mdCircleStrokeWidth)}
                cy={(mdCircleRadius + mdCircleStrokeWidth)}
                r={mdCircleRadius}
                strokeWidth={mdCircleStrokeWidth}
                strokeDasharray={2 * Math.PI * mdCircleRadius}
                strokeDashoffset={(2 * Math.PI * mdCircleRadius) * (1 - energyPercent / 100)}
                className="stroke-primary fill-transparent transition-all duration-300 ease-linear"
                strokeLinecap="round"
              />
            </svg>
            <Button
              id="tap-coin"
              variant="default"
              onClick={handleTap}
              className={cn(
                "relative rounded-full bg-foreground animate-neon-glow active:scale-95 transition-transform duration-150 flex items-center justify-center focus-visible:ring-4 focus-visible:ring-primary/50 group",
                tapButtonSizeClass
              )}
              aria-label={`Tap to mine ${CONFIG.COIN_SYMBOL}`}
              disabled={!isOnline || userData.currentEnergy < 1}
            >
              <Image
                src={sdfCoinLogoUrl}
                alt={`${CONFIG.COIN_SYMBOL} Coin`}
                width={mdTapButtonImageSize} // Use larger for better quality scaling down
                height={mdTapButtonImageSize}
                className="rounded-full pointer-events-none absolute opacity-90 group-hover:opacity-100 transition-opacity object-contain w-full h-full"
                priority
                data-ai-hint="coin logo"
              />
            </Button>
          </div>
          <div className="text-center mt-0.5 sm:mt-1"> {/* Adjusted margin */}
              <p className="text-sm sm:text-base font-semibold text-foreground"> {/* Adjusted font size */}
                  <Zap className="inline-block mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent align-text-bottom" /> {/* Adjusted icon size */}
                  {formatNumber(userData.currentEnergy, 0)} / {formatNumber(userData.maxEnergy, 0)}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{energyRegenTimerText}</p>
          </div>
        </div>


        <div className="grid grid-cols-2 gap-2 sm:gap-3"> {/* Adjusted gap */}
          <Card className="text-center shadow-md rounded-lg border-border/70">
            <CardHeader className="pb-0.5 pt-1.5 px-1.5 sm:pb-1 sm:pt-2 sm:px-2"><CardTitle className="text-[10px] sm:text-xs flex items-center justify-center text-muted-foreground"><Target className="mr-1 sm:mr-1.5 text-primary h-3.5 w-3.5 sm:h-4 sm:w-4" />Taps Today</CardTitle></CardHeader>
            <CardContent className="pt-0 pb-1.5 px-1.5 sm:pb-2 sm:px-2"><p className="text-xl sm:text-2xl font-bold text-foreground">{formatNumber(userData.tapCountToday, 0)}</p></CardContent>
          </Card>
          <Card className="text-center shadow-md rounded-lg border-border/70">
            <CardHeader className="pb-0.5 pt-1.5 px-1.5 sm:pb-1 sm:pt-2 sm:px-2"><CardTitle className="text-[10px] sm:text-xs flex items-center justify-center text-muted-foreground"><TrendingUp className="mr-1 sm:mr-1.5 text-primary h-3.5 w-3.5 sm:h-4 sm:w-4" />Tap Power</CardTitle></CardHeader>
            <CardContent className="pt-0 pb-1.5 px-1.5 sm:pb-2 sm:px-2"><p className="text-xl sm:text-2xl font-bold text-foreground">{formatNumber(userData.tapPower)} <span className="text-[10px] sm:text-xs text-muted-foreground">{CONFIG.COIN_SYMBOL}</span></p></CardContent>
          </Card>
        </div>

      </div>
      {/* Ad Container above Redeem Status */}
      <div className="w-full my-1.5 sm:my-2 -mx-2 sm:-mx-3 md:-mx-4"> {/* Adjusted margins */}
        <AdContainer pageContext="mining_middle" trigger={middleAdTrigger} />
      </div>
      <div className="p-2 sm:p-3 md:p-4 space-y-3 sm:space-y-4 pb-16 pt-1 sm:pt-2"> {/* Adjusted padding */}
        <Card className="shadow-md rounded-lg border-border/70">
          <CardHeader className="pb-1.5 pt-2 px-2.5 sm:pb-2 sm:pt-3 sm:px-3"> {/* Adjusted padding */}
            <CardTitle className="text-sm sm:text-base flex items-center font-semibold"><Info className="mr-1.5 sm:mr-2 text-primary h-3.5 w-3.5 sm:h-4 sm:w-4" />Redeem Status</CardTitle> {/* Adjusted font, icon */}
          </CardHeader>
          <CardContent className="space-y-0.5 px-2.5 pb-2.5 sm:px-3 sm:pb-3"> {/* Adjusted padding, space-y */}
            <p className="text-[11px] sm:text-xs">Minimum redeem: <strong className="text-primary">{CONFIG.MIN_REDEEM} {CONFIG.COIN_SYMBOL}</strong></p> {/* Adjusted font */}
            {remainingToRedeem > 0 ? (
              <p className="text-[11px] sm:text-xs text-destructive flex items-center"><AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0"/>You need {formatNumber(remainingToRedeem)} more {CONFIG.COIN_SYMBOL} to redeem.</p> 
            ) : (
              <p className="text-[11px] sm:text-xs text-success font-semibold flex items-center">🎉 You can now redeem your coins!</p>
            )}
          </CardContent>
        </Card>
        <PersonalizedTipDisplay />
      </div>
      {/* Existing Ad Container at the bottom */}
      <div className="w-full my-1.5 sm:my-2 -mx-2 sm:-mx-3 md:-mx-4"> {/* Adjusted margins */}
        <AdContainer pageContext="mining_bottom" trigger={bottomAdTrigger} />
      </div>
    </>
  );
}
