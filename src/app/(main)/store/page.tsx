
'use client';

import { useAppState } from '@/components/providers/app-state-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CONFIG } from '@/lib/constants';
import type { AppTheme } from '@/types';
import { Palette, CheckCircle, Lock, Coins } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function StorePage() {
  const { userData, loadingUserData, purchaseTheme, setActiveThemeState } = useAppState();
  const { toast } = useToast();
  const themes = CONFIG.APP_THEMES;

  if (loadingUserData || !userData) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-12 w-3/4 mb-6 rounded-lg" />
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-60 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  const handlePurchaseTheme = async (themeId: string) => {
    const success = await purchaseTheme(themeId);
    if (success) {
      toast({ title: "Theme Unlocked!", description: "New theme has been unlocked and applied.", variant: "default" });
    } else {
      // purchaseTheme already shows toasts for specific errors like insufficient funds
    }
  };

  const handleApplyTheme = (themeId: string) => {
    if (userData.unlockedThemes?.includes(themeId)) {
      setActiveThemeState(themeId);
      toast({ title: "Theme Applied!", description: "Enjoy the new look!", variant: "default" });
    } else {
      toast({ title: "Theme Locked", description: "You need to unlock this theme first.", variant: "destructive" });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20">
      <Card className="shadow-xl border-primary/30 rounded-xl bg-gradient-to-br from-card to-secondary/20">
        <CardHeader>
          <CardTitle className="flex items-center text-primary text-2xl">
            <Palette className="mr-3 h-8 w-8 text-accent" />
            Theme Store
          </CardTitle>
          <CardDescription className="text-base">
            Customize your app&apos;s appearance with unique themes!
          </CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-lg">Your Balance: <strong className="text-primary font-semibold">{formatNumber(userData.balance)} {CONFIG.COIN_SYMBOL}</strong></p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {themes.map((theme) => {
          const isUnlocked = userData.unlockedThemes?.includes(theme.id) ?? false;
          const isActive = userData.activeTheme === theme.id;
          const canAfford = userData.balance >= theme.cost;

          return (
            <Card
              key={theme.id}
              className={cn(
                "shadow-lg rounded-xl border-border transition-all duration-300 flex flex-col",
                isActive ? "border-primary ring-2 ring-primary shadow-primary/30" : "hover:shadow-accent/20"
              )}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg font-semibold text-foreground">
                  {theme.name}
                </CardTitle>
                <div className="flex space-x-2 mt-2">
                  <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: theme.previewColors.background }} title="Background"></div>
                  <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: theme.previewColors.primary }} title="Primary"></div>
                  <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: theme.previewColors.accent }} title="Accent"></div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                {theme.cost === 0 ? (
                  <p className="text-sm text-success font-semibold">Free</p>
                ) : (
                  <p className="text-sm font-semibold">
                    Cost: <span className="text-accent">{formatNumber(theme.cost)} {CONFIG.COIN_SYMBOL}</span>
                  </p>
                )}
              </CardContent>
              <CardFooter>
                {isUnlocked ? (
                  isActive ? (
                    <Button variant="outline" disabled className="w-full">
                      <CheckCircle className="mr-2 h-5 w-5 text-success" /> Activated
                    </Button>
                  ) : (
                    <Button onClick={() => handleApplyTheme(theme.id)} className="w-full" variant="secondary">
                      Apply Theme
                    </Button>
                  )
                ) : (
                  <Button
                    onClick={() => handlePurchaseTheme(theme.id)}
                    disabled={!canAfford || theme.cost === 0}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    <Coins className="mr-2 h-5 w-5" /> Unlock for {formatNumber(theme.cost)}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
       <p className="text-xs text-center text-muted-foreground mt-6">
        More themes coming soon!
      </p>
    </div>
  );
}
