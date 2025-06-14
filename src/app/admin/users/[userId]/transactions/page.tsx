
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ListChecks, AlertTriangle, RefreshCw, ArrowLeft, UserCircle, BadgeDollarSign } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, Timestamp, type DocumentData, doc, getDoc } from 'firebase/firestore';
import { formatNumber } from '@/lib/utils';
import type { Transaction, PaymentDetails } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface TransactionForAdminDisplay extends Omit<Transaction, 'date'> {
  date: Date | null;
}

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | "success" => {
  switch (status) {
    case 'completed': return 'success';
    case 'pending': return 'secondary';
    case 'failed': return 'destructive';
    default: return 'outline';
  }
};
const getStatusTextClass = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-success-foreground';
      case 'pending': return 'text-secondary-foreground';
      case 'failed': return 'text-destructive-foreground';
      default: return 'text-muted-foreground';
    }
}


export default function UserTransactionsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [transactions, setTransactions] = useState<TransactionForAdminDisplay[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserTransactions = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setUserName(userDocSnap.data().name || `User ${userId.substring(0, 6)}...`);
      } else {
        setUserName(`User ${userId.substring(0, 6)}... (Not Found)`);
      }

      const transactionsCollectionRef = collection(db, 'transactions');
      const q = query(transactionsCollectionRef, where('userId', '==', userId), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const fetchedTransactions: TransactionForAdminDisplay[] = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data() as DocumentData;
        const dateTimestamp = data.date as Timestamp | undefined;
        return {
          id: docSnap.id,
          ...data,
          date: dateTimestamp ? dateTimestamp.toDate() : null,
        } as TransactionForAdminDisplay;
      });
      
      setTransactions(fetchedTransactions);
    } catch (err: any) {
      console.error("Error fetching user transactions:", err);
      setError(`Failed to fetch transactions. ${err.message}.`);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserTransactions();
  }, [fetchUserTransactions]);

  const renderPaymentDetails = (details?: PaymentDetails, method?: string) => {
    if (!details || !method) return 'N/A';
    switch (method) {
      case 'upi': return `UPI: ${details.upiId} (Name: ${details.upiName || 'N/A'})`;
      case 'bank': return `A/C: ${details.accNumber}, IFSC: ${details.ifsc}, Name: ${details.accName}, Bank: ${details.bankName}`;
      case 'paytm': case 'googlepay': case 'phonepay': return `${method.toUpperCase()}: ${details.number} (Name: ${details.name || 'N/A'})`;
      default: return 'Details not available';
    }
  };

  if (error) {
    return (
      <div className="space-y-6 p-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4 text-xs sm:text-sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
        </Button>
        <Card className="border-destructive bg-destructive/10 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive text-lg sm:text-xl"><AlertTriangle className="mr-2 h-5 w-5"/>Error</CardTitle>
          </CardHeader>
          <CardContent><p className="text-destructive text-sm sm:text-base">{error}</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-1.5 sm:mb-2 text-[10px] sm:text-xs">
            <ArrowLeft className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-3.5 sm:w-3.5" /> Back to User Detail
          </Button>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-primary flex items-center">
            <UserCircle className="mr-1.5 sm:mr-2 h-5 w-5 sm:h-6 sm:w-6"/> Transactions for <span className="ml-1 truncate max-w-[150px] sm:max-w-xs">{userName || 'User'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground font-mono truncate max-w-[200px] sm:max-w-full">User ID: {userId}</p>
        </div>
        <Button onClick={fetchUserTransactions} variant="outline" size="sm" disabled={loading} className="self-start sm:self-auto text-xs sm:text-sm">
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>
      <Card className="shadow-md rounded-xl border-border">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center text-lg sm:text-xl"><ListChecks className="mr-2 h-4.5 w-4.5 sm:h-5 sm:w-5 text-primary"/>Transaction List</CardTitle>
          <CardDescription className="text-xs sm:text-sm">All recorded transactions for this user.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0 md:p-0">
          {loading ? (
            <div className="space-y-2 p-3 sm:p-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 sm:h-12 w-full rounded-md" />)}
            </div>
          ) : transactions.length === 0 ? (
             <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm sm:text-base">No transactions found for this user.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] sm:text-xs px-2 sm:px-4 py-2 sm:py-3">Date</TableHead>
                    <TableHead className="text-[10px] sm:text-xs px-2 sm:px-4 py-2 sm:py-3">Type</TableHead>
                    <TableHead className="text-right text-[10px] sm:text-xs px-2 sm:px-4 py-2 sm:py-3">Amount (SDF)</TableHead>
                    <TableHead className="text-right text-[10px] sm:text-xs px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">Amount (INR)</TableHead>
                    <TableHead className="text-[10px] sm:text-xs px-2 sm:px-4 py-2 sm:py-3">Status</TableHead>
                    <TableHead className="text-[10px] sm:text-xs px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell">Payment/Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">{txn.date ? txn.date.toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell className="capitalize text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">{txn.type.replace(/_/g, ' ')}</TableCell>
                      <TableCell className={cn("text-right font-medium text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3", txn.amount < 0 ? "text-destructive" : "text-success")}>
                        {txn.amount > 0 ? '+' : ''}{formatNumber(txn.amount, 2)}
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
                        {txn.type === 'redeem' ? `₹${formatNumber(txn.inrAmount || 0, 2)}` : 'N/A'}
                      </TableCell>
                      <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
                        <Badge variant={getStatusVariant(txn.status)} className={cn("text-[9px] sm:text-xs capitalize px-1.5 sm:px-2 py-0.5 sm:py-1", getStatusTextClass(txn.status))}>
                           {txn.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[10px] sm:text-xs max-w-[150px] sm:max-w-[200px] truncate px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell">
                        {txn.type === 'redeem' ? renderPaymentDetails(txn.paymentDetails, txn.paymentMethod) : txn.details || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
