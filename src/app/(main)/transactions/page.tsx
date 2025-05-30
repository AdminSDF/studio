
'use client';

import { useAppState } from '@/components/providers/app-state-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CONFIG } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import type { Transaction } from '@/types';
import { History, TrendingDown, TrendingUp, Gift, Award, CircleHelp, ArrowRightLeft } from 'lucide-react'; // Added ArrowRightLeft
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { AdContainer } from '@/components/shared/ad-container';
import { useState } from 'react';

function getTransactionIcon(type: string) {
  switch (type) {
    case 'redeem': return <TrendingDown className="text-red-500" />;
    case 'booster_purchase': return <TrendingDown className="text-orange-500" />;
    case 'daily_bonus': return <Gift className="text-green-500" />;
    case 'referral_bonus': return <Award className="text-yellow-500" />;
    case 'achievement_reward': return <Award className="text-teal-500" />;
    case 'p2p_send': return <ArrowRightLeft className="text-orange-600" />;
    case 'p2p_receive': return <ArrowRightLeft className="text-green-600" />;
    default: return <CircleHelp className="text-gray-500" />;
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
  let amountClass = 'text-foreground'; // Default

  if (txn.type === 'redeem') {
    amountDisplay = `-${formatNumber(txn.amount)} ${CONFIG.COIN_SYMBOL} (₹${formatNumber(txn.inrAmount || 0)})`;
    typeDisplay = `Redeem via ${String(txn.paymentMethod).toUpperCase()}`;
    amountClass = 'text-destructive';
  } else if (txn.type === 'booster_purchase') {
    amountDisplay = `-${formatNumber(txn.amount)} ${CONFIG.COIN_SYMBOL}`;
    typeDisplay = `Booster: ${txn.details || 'Upgrade'}`;
    amountClass = 'text-destructive';
  } else if (txn.type === 'daily_bonus') {
    amountDisplay = `+${formatNumber(txn.amount)} ${CONFIG.COIN_SYMBOL}`;
    typeDisplay = `Daily Login Bonus`;
    amountClass = 'text-success';
  } else if (txn.type === 'referral_bonus') {
    amountDisplay = `+${formatNumber(txn.amount)} ${CONFIG.COIN_SYMBOL}`;
    typeDisplay = `Referral Bonus`;
    amountClass = 'text-success';
  } else if (txn.type === 'achievement_reward') {
    amountDisplay = `+${formatNumber(txn.amount)} ${CONFIG.COIN_SYMBOL}`;
    typeDisplay = `Achievement: ${txn.details || 'Reward'}`;
    amountClass = 'text-success';
  } else if (txn.type === 'p2p_send') {
    amountDisplay = `-${formatNumber(txn.amount)} ${CONFIG.COIN_SYMBOL}`;
    typeDisplay = `Sent to ${txn.relatedUserName || txn.relatedUserId || 'user'}`;
    amountClass = 'text-destructive';
  } else if (txn.type === 'p2p_receive') {
    amountDisplay = `+${formatNumber(txn.amount)} ${CONFIG.COIN_SYMBOL}`;
    typeDisplay = `Received from ${txn.relatedUserName || txn.relatedUserId || 'user'}`;
    amountClass = 'text-success';
  } else {
    amountDisplay = `${txn.amount > 0 ? '+' : ''}${formatNumber(txn.amount)} ${CONFIG.COIN_SYMBOL}`;
    typeDisplay = txn.type ? txn.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Miscellaneous';
    amountClass = txn.amount < 0 ? 'text-destructive' : 'text-success';
  }


  return (
    <Card className="mb-3 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center mb-1">
              {getTransactionIcon(txn.type)}
              <p className="ml-2 font-semibold text-primary">{typeDisplay}</p>
            </div>
            <p className="text-sm text-muted-foreground">{dateObj.toLocaleString()}</p>
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
          <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
            {txn.paymentMethod === 'upi' && <p>UPI: {String(txn.paymentDetails.upiId)} ({String(txn.paymentDetails.upiName)})</p>}
            {txn.paymentMethod === 'bank' && <p>Bank: A/C ending {String(txn.paymentDetails.accNumber).slice(-4)} ({String(txn.paymentDetails.bankName)})</p>}
            {(txn.paymentMethod === 'paytm' || txn.paymentMethod === 'googlepay' || txn.paymentMethod === 'phonepay') && <p>{String(txn.paymentMethod).toUpperCase()}: {String(txn.paymentDetails.number)} ({String(txn.paymentDetails.name)})</p>}
          </div>
        )}
         {(txn.type === 'p2p_send' || txn.type === 'p2p_receive') && (txn.relatedUserId || txn.relatedUserName) && (
          <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
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
      <div className="p-4 space-y-3">
        <Skeleton className="h-10 w-1/2 mb-4" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20">
      <Card className="shadow-lg border-primary">
        <CardHeader>
          <CardTitle className="flex items-center text-primary"><History className="mr-2" /> Transaction History</CardTitle>
          <CardDescription>View your recent account activity.</CardDescription>
        </CardHeader>
      </Card>

      {transactions.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <CircleHelp className="mx-auto h-12 w-12 mb-4 text-gray-400" />
            <p>No transactions yet.</p>
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
      <AdContainer pageContext="transactions" trigger={_adTrigger} />
    </div>
  );
}
