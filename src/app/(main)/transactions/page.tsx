
'use client';

import { useAppState } from '@/components/providers/app-state-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CONFIG } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import type { Transaction } from '@/types';
import { History, TrendingDown, TrendingUp, Gift, Award, CircleHelp, ArrowRightLeft, Palette, Clock, Zap, Star } from 'lucide-react'; 
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { AdContainer } from '@/components/shared/ad-container';
import { useState } from 'react';
import { PersonalizedTipDisplay } from '@/components/shared/personalized-tip-display';

function getTransactionIcon(type: string) {
  switch (type) {
    case 'redeem': return <TrendingDown className="text-destructive" />;
    case 'booster_purchase': return <Zap className="text-accent" />;
    case 'daily_bonus': return <Gift className="text-success" />;
    case 'referral_bonus': return <Award className="text-accent" />;
    case 'achievement_reward': return <Award className="text-primary" />;
    case 'p2p_send': return <ArrowRightLeft className="text-destructive" />;
    case 'p2p_receive': return <ArrowRightLeft className="text-success" />;
    case 'quest_reward': return <Star className="text-accent" />;
    case 'theme_purchase': return <Palette className="text-accent" />;
    case 'offline_earnings': return <Clock className="text-primary" />;
    default: return <CircleHelp className="text-muted-foreground" />;
  }
}

function getTransactionStatusClass(status: string) {
  switch (status) {
    case 'completed': return 'bg-success text-success-foreground';
    case 'pending': return 'bg-warning text-warning-foreground';
    case 'failed': return 'bg-destructive text-destructive-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
}

function TransactionItem({ txn }: { txn: Transaction }) {
  const dateObj = txn.date instanceof Date ? txn.date : (txn.date as any).toDate();
  
  let amountDisplay = '';
  let typeDisplay = 'Unknown Transaction';
  let amountClass = 'text-foreground'; 

  const formatTypeDisplay = (typeStr: string, details?: string) => {
    let base = typeStr.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    if (details) base += `: ${details}`;
    return base;
  }

  switch (txn.type) {
    case 'redeem':
      amountDisplay = `-${formatNumber(txn.amount)} ${CONFIG.COIN_SYMBOL} (₹${formatNumber(txn.inrAmount || 0)})`;
      typeDisplay = `Redeem via ${String(txn.paymentMethod).toUpperCase()}`;
      amountClass = 'text-destructive';
      break;
    case 'booster_purchase':
      amountDisplay = `-${formatNumber(txn.amount)} ${CONFIG.COIN_SYMBOL}`;
      typeDisplay = formatTypeDisplay('Booster Purchase', txn.details);
      amountClass = 'text-destructive';
      break;
    case 'daily_bonus':
      amountDisplay = `+${formatNumber(txn.amount)} ${CONFIG.COIN_SYMBOL}`;
      typeDisplay = `Daily Login Bonus`;
      amountClass = 'text-success';
      break;
    case 'referral_bonus':
      amountDisplay = `+${formatNumber(txn.amount)} ${CONFIG.COIN_SYMBOL}`;
      typeDisplay = formatTypeDisplay('Referral Bonus', txn.details);
      amountClass = 'text-success';
      break;
    case 'achievement_reward':
      amountDisplay = `+${formatNumber(txn.amount)} ${CONFIG.COIN_SYMBOL}`;
      typeDisplay = formatTypeDisplay('Achievement Reward', txn.details);
      amountClass = 'text-success';
      break;
    case 'p2p_send':
      amountDisplay = `-${formatNumber(txn.amount)} ${CONFIG.COIN_SYMBOL}`;
      typeDisplay = `Sent to ${txn.relatedUserName || txn.relatedUserId || 'user'}`;
      amountClass = 'text-destructive';
      break;
    case 'p2p_receive':
      amountDisplay = `+${formatNumber(txn.amount)} ${CONFIG.COIN_SYMBOL}`;
      typeDisplay = `Received from ${txn.relatedUserName || txn.relatedUserId || 'user'}`;
      amountClass = 'text-success';
      break;
    case 'quest_reward':
      amountDisplay = `+${formatNumber(txn.amount)} ${CONFIG.COIN_SYMBOL}`;
      typeDisplay = formatTypeDisplay('Quest Reward', txn.details);
      amountClass = 'text-success';
      break;
    case 'theme_purchase':
      amountDisplay = `-${formatNumber(txn.amount)} ${CONFIG.COIN_SYMBOL}`;
      typeDisplay = formatTypeDisplay('Theme Purchase', txn.details);
      amountClass = 'text-destructive';
      break;
    case 'offline_earnings':
      amountDisplay = `+${formatNumber(txn.amount)} ${CONFIG.COIN_SYMBOL}`;
      typeDisplay = `Offline Earnings`;
      amountClass = 'text-success';
      break;
    default:
      amountDisplay = `${txn.amount > 0 ? '+' : ''}${formatNumber(txn.amount)} ${CONFIG.COIN_SYMBOL}`;
      typeDisplay = txn.type ? txn.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Miscellaneous';
      amountClass = txn.amount < 0 ? 'text-destructive' : 'text-success';
  }


  return (
    <Card className="mb-3 shadow-sm hover:shadow-md transition-shadow rounded-lg border-border/70">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center mb-1">
              {getTransactionIcon(txn.type)}
              <p className="ml-2 font-semibold text-foreground text-base">{typeDisplay}</p>
            </div>
            <p className="text-xs text-muted-foreground">{dateObj.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className={cn("font-bold text-lg", amountClass)}>
              {amountDisplay}
            </p>
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getTransactionStatusClass(txn.status))}>
              {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
            </span>
          </div>
        </div>
        {txn.type === 'redeem' && txn.paymentDetails && (
          <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
            {txn.paymentMethod === 'upi' && <p>UPI: {String(txn.paymentDetails.upiId)} ({String(txn.paymentDetails.upiName)})</p>}
            {txn.paymentMethod === 'bank' && <p>Bank: A/C ending {String(txn.paymentDetails.accNumber).slice(-4)} ({String(txn.paymentDetails.bankName)})</p>}
            {(txn.paymentMethod === 'paytm' || txn.paymentMethod === 'googlepay' || txn.paymentMethod === 'phonepay') && <p>{String(txn.paymentMethod).toUpperCase()}: {String(txn.paymentDetails.number)} ({String(txn.paymentDetails.name)})</p>}
          </div>
        )}
         {(txn.type === 'p2p_send' || txn.type === 'p2p_receive') && (txn.relatedUserId || txn.relatedUserName) && (
          <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
            <p>
              {txn.type === 'p2p_send' ? 'To: ' : 'From: '}
              {txn.relatedUserName || txn.relatedUserId}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TransactionsPage() {
  const { transactions, loadingUserData } = useAppState();
  const [_adTrigger, _setAdTrigger] = useState(false); 

  if (loadingUserData && transactions.length === 0) {
    return (
      <div className="p-4 md:p-6 space-y-3">
        <Skeleton className="h-10 w-1/2 mb-4 rounded-lg" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20">
      <Card className="shadow-xl border-primary/30 rounded-xl bg-gradient-to-br from-card to-secondary/20">
        <CardHeader>
          <CardTitle className="flex items-center text-primary text-2xl"><History className="mr-2.5 h-7 w-7" /> Transaction History</CardTitle>
          <CardDescription className="text-base">View your recent account activity.</CardDescription>
        </CardHeader>
      </Card>

      {transactions.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="p-6 text-center text-muted-foreground">
            <CircleHelp className="mx-auto h-12 w-12 mb-4 text-gray-400" />
            <p className="text-lg font-semibold">No transactions yet.</p>
            <p className="text-sm">Start mining and redeem your {CONFIG.COIN_SYMBOL} to see your history here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {transactions.map(txn => (
            <TransactionItem key={txn.id} txn={txn} />
          ))}
        </div>
      )}
      <PersonalizedTipDisplay />
      <AdContainer pageContext="transactions" trigger={_adTrigger} />
    </div>
  );
}
