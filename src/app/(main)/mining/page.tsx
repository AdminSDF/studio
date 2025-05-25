'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppState } from '@/components/providers/app-state-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CONFIG } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import { Zap, DollarSign, Target, Info, AlertTriangle, Wallet } from 'lucide-react'; // Added Wallet
import { useToast } from '@/hooks/use-toast';
import { AdContainer } from '@/components/shared/ad-container';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton'; // Added Skeleton import

// Helper to show floating tap value
function showFloatingTapValue(amount: number, coinElementId: string) {
  const coinContainer = document.getElementById(coinElementId)?.parentElement;
  if (!coinContainer) return;

  const floatEl = document.createElement('div');
  floatEl.className = 'floating-tap-value absolute top-1/2 left-1/2 pointer-events-none text-lg font-bold text-primary animate-floatUp';
  floatEl.textContent = `+${formatNumber(amount, 2)}`; // Ensure 2 decimal places for tap value
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
      const lastUpdate = userData.lastEnergyUpdate ? new Date(userData.lastEnergyUpdate as any) : now; // Ensure Date object
      const secondsPassed = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);

      let newEnergy = userData.currentEnergy;
      if (secondsPassed > 0 && userData.currentEnergy < userData.maxEnergy) {
        const energyGained = secondsPassed * CONFIG.ENERGY_REGEN_RATE_PER_SECOND;
        newEnergy = Math.min(userData.maxEnergy, userData.currentEnergy + energyGained);
        
        // Update local state first for responsiveness
        updateEnergy(newEnergy, now);
        
        // Then update Firestore (debounced or less frequently in a real app)
        updateUserFirestoreData({ currentEnergy: newEnergy, lastEnergyUpdate: now }).catch(error => {
          console.error("Error saving energy update:", error);
        });
      } else if (userData.currentEnergy >= userData.maxEnergy) {
         // To prevent constant Firestore updates when full, only update if lastEnergyUpdate is old
        if (now.getTime() - lastUpdate.getTime() > 5 * 60 * 1000) { // e.g. update every 5 mins if full
            updateUserFirestoreData({ lastEnergyUpdate: now });
        }
      }
      
      // Update timer text
      if (newEnergy >= userData.maxEnergy) {
        setEnergyRegenTimerText("Energy Full!");
      } else {
        const currentRegenRate = CONFIG.ENERGY_REGEN_RATE_PER_SECOND;
        const timeToNextEnergyPoint = currentRegenRate > 0 ? Math.ceil(1 / currentRegenRate) : Infinity;
        const energyToFull = userData.maxEnergy - newEnergy;
        const timeToFullSeconds = currentRegenRate > 0 ? Math.ceil(energyToFull / currentRegenRate) : Infinity;
        
        let timerText = `+1 in ~${timeToNextEnergyPoint}s. `;
        if (timeToFullSeconds < Infinity && timeToFullSeconds > 0 && timeToFullSeconds <= 3600) {
          const minutes = Math.floor(timeToFullSeconds / 60);
          const seconds = timeToFullSeconds % 60;
          timerText += `Full in ${minutes > 0 ? minutes + 'm ' : ''}${seconds}s.`;
        } else if (timeToFullSeconds > 3600) {
          timerText += `Full in >1hr.`;
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
      coinElement.style.transform = 'scale(0.95)';
      setTimeout(() => coinElement.style.transform = 'scale(1)', 100);
      showFloatingTapValue(coinsMined, 'tap-coin');
    }
    
    const newTapCountForAd = tapCountForAd + 1;
    setTapCountForAd(newTapCountForAd);
    if (newTapCountForAd % CONFIG.MAX_TAPS_BEFORE_AD_CHECK === 0) {
      setTriggerAd(prev => !prev); // Toggle to trigger AdContainer's useEffect
    }

    const today = new Date().toDateString();
    const newTapCountToday = userData.lastTapDate === today ? userData.tapCountToday + 1 : 1;

    // Optimistic local update
    updateEnergy(userData.currentEnergy - 1, new Date()); // Update energy locally first
    
    try {
      // Firestore update
      await updateUserFirestoreData({
        balance: (userData.balance || 0) + coinsMined,
        tapCountToday: newTapCountToday,
        lastTapDate: today, // Will be converted to Timestamp by AppStateProvider
        currentEnergy: userData.currentEnergy -1, // This will be the value before regen tick potentially
        lastEnergyUpdate: new Date() // This will be converted by AppStateProvider
      });
      // Data will sync back via onSnapshot, or rely on local state for immediate feedback
    } catch (error) {
      console.error('Error saving tap:', error);
      toast({ title: 'Sync Error', description: 'Failed to save mining data.', variant: 'destructive' });
      // Potentially revert optimistic update or handle more gracefully
    }
  }, [isOnline, userData, updateUserFirestoreData, updateEnergy, toast, tapCountForAd]);

  if (!userData) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-40 w-40 mx-auto rounded-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  const energyPercent = userData.maxEnergy > 0 ? (userData.currentEnergy / userData.maxEnergy) * 100 : 0;
  const balanceInrValue = userData.balance * CONFIG.CONVERSION_RATE;
  const remainingToRedeem = Math.max(0, CONFIG.MIN_REDEEM - userData.balance);

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20"> {/* Added padding-bottom for navbar */}
      <Card className="shadow-lg border-primary">
        <CardHeader>
          <CardTitle className="flex items-center text-primary"><Wallet className="mr-2" /> Your Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">{formatNumber(userData.balance)} <span className="text-2xl">{CONFIG.COIN_SYMBOL}</span></div>
          <p className="text-sm text-muted-foreground">≈ ₹{formatNumber(balanceInrValue)} INR</p>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center text-lg"><Zap className="mr-2 text-yellow-500" />Energy</CardTitle>
          <CardDescription>{formatNumber(userData.currentEnergy, 0)} / {formatNumber(userData.maxEnergy, 0)}</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={energyPercent} className="w-full h-3 [&>div]:bg-yellow-500" />
          <p className="text-xs text-muted-foreground text-center mt-2">{energyRegenTimerText}</p>
        </CardContent>
      </Card>
      
      <div className="flex justify-center my-8 relative" id="coin-container">
        <Button
          id="tap-coin"
          variant="default"
          onClick={handleTap}
          className="relative w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-accent to-primary text-primary-foreground text-2xl font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all duration-150 flex items-center justify-center"
          aria-label={`Tap to mine ${CONFIG.COIN_SYMBOL}`}
          disabled={!isOnline || userData.currentEnergy < 1}
        >
          <Image src="https://placehold.co/120x120.png" alt="Coin" width={120} height={120} className="rounded-full pointer-events-none" data-ai-hint="coin gold"/>
          <span className="absolute inset-0 flex items-center justify-center font-bold text-3xl text-white" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>TAP</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center shadow-md">
          <CardHeader><CardTitle className="text-base flex items-center justify-center"><Target className="mr-2 text-primary" />Taps Today</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatNumber(userData.tapCountToday, 0)}</p></CardContent>
        </Card>
        <Card className="text-center shadow-md">
          <CardHeader><CardTitle className="text-base flex items-center justify-center"><DollarSign className="mr-2 text-green-500" />Tap Power</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatNumber(userData.tapPower)} <span className="text-sm">{CONFIG.COIN_SYMBOL}</span></p></CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center"><Info className="mr-2 text-blue-500" />Redeem Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Minimum redeem: {CONFIG.MIN_REDEEM} {CONFIG.COIN_SYMBOL}</p>
          {remainingToRedeem > 0 ? (
            <p className="text-destructive flex items-center"><AlertTriangle className="h-4 w-4 mr-1"/>You need {formatNumber(remainingToRedeem)} more {CONFIG.COIN_SYMBOL} to redeem.</p>
          ) : (
            <p className="text-success font-semibold">You can now redeem your coins!</p>
          )}
        </CardContent>
      </Card>
      
      <AdContainer pageContext="mining" trigger={triggerAd} />

    </div>
  );
}
