
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppState } from '@/components/providers/app-state-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CONFIG } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import { Zap, DollarSign, Target, Info, AlertTriangle, Wallet, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdContainer } from '@/components/shared/ad-container';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

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
  const { toast } = useToast();
  const [energyRegenTimerText, setEnergyRegenTimerText] = useState("Calculating...");
  const [tapCountForAd, setTapCountForAd] = useState(0);
  const [triggerAd, setTriggerAd] = useState(false);

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

    const coinsMined = userData.tapPower;
    
    const coinElement = document.getElementById('tap-coin');
    if (coinElement) {
      coinElement.classList.add('animate-pulseOnce'); // Add animation class
      setTimeout(() => coinElement.classList.remove('animate-pulseOnce'), 200); // Remove after animation
      showFloatingTapValue(coinsMined, 'tap-coin');
    }
    
    const newTapCountForAd = tapCountForAd + 1;
    setTapCountForAd(newTapCountForAd);
    if (newTapCountForAd % CONFIG.MAX_TAPS_BEFORE_AD_CHECK === 0) {
      setTriggerAd(prev => !prev); 
    }

    const today = new Date().toDateString();
    const newTapCountToday = userData.lastTapDate === today ? userData.tapCountToday + 1 : 1;
    
    updateEnergy(userData.currentEnergy - 1, new Date()); 
    
    try {
      await updateUserFirestoreData({
        balance: (userData.balance || 0) + coinsMined,
        tapCountToday: newTapCountToday,
        lastTapDate: today, 
        currentEnergy: userData.currentEnergy -1, 
        lastEnergyUpdate: new Date() 
      });
    } catch (error) {
      console.error('Error saving tap:', error);
      toast({ title: 'Sync Error', description: 'Failed to save mining data.', variant: 'destructive' });
    }
  }, [isOnline, userData, updateUserFirestoreData, updateEnergy, toast, tapCountForAd]);

  if (!userData) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-48 w-48 mx-auto rounded-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const energyPercent = userData.maxEnergy > 0 ? (userData.currentEnergy / userData.maxEnergy) * 100 : 0;
  const balanceInrValue = userData.balance * CONFIG.CONVERSION_RATE;
  const remainingToRedeem = Math.max(0, CONFIG.MIN_REDEEM - userData.balance);

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20">
      <Card className="shadow-lg border-primary/50 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-primary text-xl"><Wallet className="mr-2.5 h-6 w-6" /> Your Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">{formatNumber(userData.balance)} <span className="text-2xl opacity-80">{CONFIG.COIN_SYMBOL}</span></div>
          <p className="text-sm text-muted-foreground mt-1">≈ ₹{formatNumber(balanceInrValue)} INR</p>
        </CardContent>
      </Card>

      <Card className="shadow-md rounded-xl border-border">
        <CardHeader>
          <CardTitle className="flex items-center text-lg font-semibold"><Zap className="mr-2 text-yellow-500 h-5 w-5" />Energy Level</CardTitle>
          <CardDescription className="text-sm">{formatNumber(userData.currentEnergy, 0)} / {formatNumber(userData.maxEnergy, 0)}</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={energyPercent} className="w-full h-3 rounded-full [&>div]:bg-gradient-to-r [&>div]:from-yellow-400 [&>div]:to-orange-500" />
          <p className="text-xs text-muted-foreground text-center mt-2.5">{energyRegenTimerText}</p>
        </CardContent>
      </Card>
      
      <div className="flex justify-center my-8 relative" id="coin-container">
        <Button
          id="tap-coin"
          variant="default"
          onClick={handleTap}
          className="relative w-48 h-48 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground text-3xl font-bold shadow-2xl hover:shadow-primary/30 active:scale-95 transition-all duration-150 flex items-center justify-center focus-visible:ring-4 focus-visible:ring-primary/50"
          aria-label={`Tap to mine ${CONFIG.COIN_SYMBOL}`}
          disabled={!isOnline || userData.currentEnergy < 1}
        >
          <Image src="https://placehold.co/150x150.png" alt="Coin" width={150} height={150} className="rounded-full pointer-events-none absolute opacity-50 group-hover:opacity-75 transition-opacity" data-ai-hint="gold coin texture" />
          <span className="relative z-10 font-extrabold text-4xl text-white" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.3)'}}>TAP</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center shadow-md rounded-xl border-border">
          <CardHeader className="pb-2 pt-4"><CardTitle className="text-base flex items-center justify-center text-muted-foreground"><Target className="mr-2 text-primary h-5 w-5" />Taps Today</CardTitle></CardHeader>
          <CardContent className="pt-0 pb-4"><p className="text-3xl font-bold text-foreground">{formatNumber(userData.tapCountToday, 0)}</p></CardContent>
        </Card>
        <Card className="text-center shadow-md rounded-xl border-border">
          <CardHeader className="pb-2 pt-4"><CardTitle className="text-base flex items-center justify-center text-muted-foreground"><TrendingUp className="mr-2 text-green-500 h-5 w-5" />Tap Power</CardTitle></CardHeader>
          <CardContent className="pt-0 pb-4"><p className="text-3xl font-bold text-foreground">{formatNumber(userData.tapPower)} <span className="text-sm text-muted-foreground">{CONFIG.COIN_SYMBOL}</span></p></CardContent>
        </Card>
      </div>

      <Card className="shadow-md rounded-xl border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center font-semibold"><Info className="mr-2 text-blue-500 h-5 w-5" />Redeem Status</CardTitle>
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
      
      <AdContainer pageContext="mining" trigger={triggerAd} />

    </div>
  );
}
