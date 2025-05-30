
'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAppState } from '@/components/providers/app-state-provider';
import { CONFIG } from '@/lib/constants';
import { Gift, Sparkles } from 'lucide-react';

export function DailyBonusModal() {
  const { userData, claimDailyBonus } = useAppState();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (userData) {
      const today = new Date().toDateString();
      const lastClaimDate = userData.lastLoginBonusClaimed ? new Date(userData.lastLoginBonusClaimed).toDateString() : null;
      if (lastClaimDate !== today) {
        setIsOpen(true);
      }
    }
  }, [userData]);

  const handleClaim = async () => {
    await claimDailyBonus();
    setIsOpen(false);
  };

  if (!isOpen || !userData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md bg-card border-primary/50 shadow-xl rounded-xl">
        <DialogHeader className="items-center text-center pt-2">
           <Sparkles className="h-12 w-12 text-accent mb-3" />
          <DialogTitle className="text-2xl font-bold text-primary flex items-center justify-center">
            <Gift className="mr-2.5 h-7 w-7 text-accent" />
            Daily Login Bonus!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2 text-base">
            Welcome back! Here&apos;s a little something for logging in today.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 text-center">
          <p className="text-3xl font-bold">
            You get <span className="text-accent">{CONFIG.DAILY_LOGIN_BONUS} {CONFIG.COIN_SYMBOL}</span>!
          </p>
        </div>
        <DialogFooter>
          <Button onClick={handleClaim} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6 rounded-lg font-semibold">
            Claim Bonus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
