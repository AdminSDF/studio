
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CONFIG } from '@/lib/constants';
import { Clock, Sparkles,Coins } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface OfflineEarningsModalProps {
  isOpen: boolean;
  earnedAmount: number;
  onClaim: () => void; // Changed from onClose to onClaim for clarity
}

export function OfflineEarningsModal({ isOpen, earnedAmount, onClaim }: OfflineEarningsModalProps) {
  if (!isOpen || earnedAmount <= 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClaim()}> {/* Claim on close if not explicitly claimed */}
      <DialogContent className="sm:max-w-md bg-card border-primary/50 shadow-xl rounded-xl">
        <DialogHeader className="items-center text-center pt-2">
          <Clock className="h-12 w-12 text-primary mb-3" />
          <DialogTitle className="text-2xl font-bold text-primary flex items-center justify-center">
            <Sparkles className="mr-2.5 h-7 w-7 text-accent" />
            Welcome Back!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2 text-base">
            You earned some {CONFIG.COIN_SYMBOL} while you were away.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 text-center">
          <p className="text-3xl font-bold flex items-center justify-center">
            <Coins className="h-8 w-8 mr-2 text-yellow-500" />
            {formatNumber(earnedAmount)} <span className="text-xl ml-1.5 opacity-80">{CONFIG.COIN_SYMBOL}</span>
          </p>
        </div>
        <DialogFooter>
          <Button onClick={onClaim} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6 rounded-lg font-semibold">
            Claim Earnings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
