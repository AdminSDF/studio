'use client';

import { useAppState } from '@/components/providers/app-state-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CONFIG, type Booster } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import { Rocket, TrendingUp, BadgeDollarSign, CheckCircle, ShoppingCart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AdContainer } from '@/components/shared/ad-container';
import { useState } from 'react';

export default function BoostersPage() {
  const { userData, purchaseBooster, loadingUserData } = useAppState();
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null); // Store ID of booster being purchased
  const [adTrigger, setAdTrigger] = useState(false); // State to trigger ad loading

  const handlePurchase = async (booster: Booster) => {
    setIsPurchasing(booster.id);
    await purchaseBooster(booster.id);
    setIsPurchasing(null);
    setAdTrigger(prev => !prev); // Trigger ad refresh on purchase
  };

  if (loadingUserData || !userData) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-1/2 mb-4" />
        <Skeleton className="h-20 w-full" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20">
      <Card className="shadow-lg border-primary">
        <CardHeader>
          <CardTitle className="flex items-center text-primary"><Rocket className="mr-2" /> Boosters & Upgrades</CardTitle>
          <CardDescription>Spend your {CONFIG.COIN_SYMBOL} to improve your mining capabilities!</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg">Your Balance: <strong className="text-primary">{formatNumber(userData.balance)} {CONFIG.COIN_SYMBOL}</strong></p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CONFIG.BOOSTERS.map((booster) => {
          const currentLevel = userData.boostLevels?.[booster.id] || 0;
          const canUpgrade = currentLevel < booster.maxLevel;
          const cost = Math.round(booster.cost * Math.pow(1.5, currentLevel));

          return (
            <Card key={booster.id} className="flex flex-col shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-center text-lg text-accent">
                  {booster.effect_type === 'tap_power' ? <TrendingUp className="mr-2" /> : <BadgeDollarSign className="mr-2" />}
                  {booster.name}
                </CardTitle>
                <CardDescription>{booster.description.replace(CONFIG.COIN_SYMBOL, CONFIG.COIN_SYMBOL)}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p>Current Level: <span className="font-semibold">{currentLevel} / {booster.maxLevel}</span></p>
                {canUpgrade && (
                  <p>Next Level Cost: <strong className="text-primary">{formatNumber(cost)} {CONFIG.COIN_SYMBOL}</strong></p>
                )}
              </CardContent>
              <CardFooter>
                {canUpgrade ? (
                  <Button
                    onClick={() => handlePurchase(booster)}
                    disabled={userData.balance < cost || isPurchasing === booster.id}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {isPurchasing === booster.id ? 'Processing...' : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" /> Upgrade to Level {currentLevel + 1}
                      </>
                    )}
                  </Button>
                ) : (
                  <p className="text-success font-semibold flex items-center w-full justify-center">
                    <CheckCircle className="mr-2 h-5 w-5" /> Max level reached!
                  </p>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
      <AdContainer pageContext="boosters" trigger={adTrigger} />
    </div>
  );
}
