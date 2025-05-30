
'use client';

import { useAppState } from '@/components/providers/app-state-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CONFIG, type Booster } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import { Rocket, TrendingUp, Zap, CheckCircle, ShoppingCart, HelpCircle } from 'lucide-react'; // Changed BadgeDollarSign to Zap
import { Skeleton } from '@/components/ui/skeleton';
import { AdContainer } from '@/components/shared/ad-container';
import { useState } from 'react';

const getBoosterIcon = (effectType: Booster['effect_type']) => {
  switch (effectType) {
    case 'tap_power':
      return <TrendingUp className="mr-2 h-5 w-5 text-primary" />;
    case 'max_energy':
      return <Zap className="mr-2 h-5 w-5 text-yellow-500" />;
    default:
      return <HelpCircle className="mr-2 h-5 w-5 text-muted-foreground" />;
  }
};

export default function BoostersPage() {
  const { userData, purchaseBooster, loadingUserData } = useAppState();
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [adTrigger, setAdTrigger] = useState(false); 

  const handlePurchase = async (booster: Booster) => {
    setIsPurchasing(booster.id);
    await purchaseBooster(booster.id);
    setIsPurchasing(null);
    setAdTrigger(prev => !prev); 
  };

  if (loadingUserData || !userData) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-12 w-3/4 mb-6 rounded-lg" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20">
      <Card className="shadow-xl border-primary/30 rounded-xl bg-gradient-to-br from-card to-secondary/20">
        <CardHeader>
          <CardTitle className="flex items-center text-primary text-2xl"><Rocket className="mr-2.5 h-7 w-7" /> Boosters & Upgrades</CardTitle>
          <CardDescription className="text-base">Spend your {CONFIG.COIN_SYMBOL} to enhance your mining powers!</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xl">Your Balance: <strong className="text-primary font-semibold">{formatNumber(userData.balance)} {CONFIG.COIN_SYMBOL}</strong></p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CONFIG.BOOSTERS.map((booster) => {
          const currentLevel = userData.boostLevels?.[booster.id] || 0;
          const canUpgrade = currentLevel < booster.maxLevel;
          const cost = Math.round(booster.cost * Math.pow(1.5, currentLevel));

          return (
            <Card key={booster.id} className="flex flex-col shadow-lg hover:shadow-primary/20 transition-shadow duration-300 rounded-xl border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg font-semibold text-foreground">
                  {getBoosterIcon(booster.effect_type)}
                  {booster.name}
                </CardTitle>
                <CardDescription className="text-sm mt-1">{booster.description.replace(CONFIG.COIN_SYMBOL, CONFIG.COIN_SYMBOL)}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-1.5">
                <p className="text-sm">Current Level: <span className="font-semibold text-primary">{currentLevel} / {booster.maxLevel}</span></p>
                {canUpgrade && (
                  <p className="text-sm">Next Level Cost: <strong className="text-accent font-semibold">{formatNumber(cost)} {CONFIG.COIN_SYMBOL}</strong></p>
                )}
                 {!canUpgrade && (
                  <p className="text-sm text-success font-semibold flex items-center">
                    <CheckCircle className="mr-1.5 h-4 w-4" /> Max level achieved!
                  </p>
                )}
              </CardContent>
              <CardFooter>
                {canUpgrade ? (
                  <Button
                    onClick={() => handlePurchase(booster)}
                    disabled={userData.balance < cost || isPurchasing === booster.id}
                    className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-semibold"
                    size="lg"
                  >
                    {isPurchasing === booster.id ? 'Processing...' : (
                      <>
                        <ShoppingCart className="mr-2 h-5 w-5" /> Upgrade to Level {currentLevel + 1}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    disabled={true}
                    className="w-full bg-muted hover:bg-muted text-muted-foreground font-semibold"
                    size="lg"
                    variant="outline"
                  >
                     <CheckCircle className="mr-2 h-5 w-5 text-success" /> Max Level
                  </Button>
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
