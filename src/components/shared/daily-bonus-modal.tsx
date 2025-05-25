'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAppState } from '@/components/providers/app-state-provider';
import { CONFIG } from '@/lib/constants';
import { Gift } from 'lucide-react';

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
      <DialogContent className="sm:max-w-md bg-card border-primary shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary flex items-center">
            <Gift className="mr-2 h-6 w-6 text-accent" />
            Daily Login Bonus!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2">
            You&apos;ve earned a special bonus for logging in today.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-center">
          <p className="text-lg">
            You get <strong className="text-accent font-bold">{CONFIG.DAILY_LOGIN_BONUS} {CONFIG.COIN_SYMBOL}</strong>!
          </p>
        </div>
        <DialogFooter>
          <Button onClick={handleClaim} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            Claim Bonus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
