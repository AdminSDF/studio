
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

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'completed': return 'default';
    case 'pending': return 'secondary';
    case 'failed': return 'destructive';
    default: return 'outline';
  }
};

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
      // Fetch user details to get name
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setUserName(userDocSnap.data().name || `User ${userId.substring(0, 6)}...`);
      } else {
        setUserName(`User ${userId.substring(0, 6)}... (Not Found)`);
      }

      // Fetch transactions for the user
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
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
        </Button>
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive"><AlertTriangle className="mr-2 h-5 w-5"/>Error</CardTitle>
          </CardHeader>
          <CardContent><p className="text-destructive">{error}</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
          </Button>
          <h2 className="text-2xl font-bold tracking-tight text-primary flex items-center">
            <UserCircle className="mr-2 h-6 w-6"/> Transactions for {userName || 'User'}
          </h2>
          <p className="text-sm text-muted-foreground">User ID: {userId}</p>
        </div>
        <Button onClick={fetchUserTransactions} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>
      <Card className="shadow-md rounded-xl border-border">
        <CardHeader>
          <CardTitle className="flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary"/>Transaction List</CardTitle>
          <CardDescription>All recorded transactions for this user.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
            </div>
          ) : transactions.length === 0 ? (
             <p className="text-muted-foreground text-center py-8">No transactions found for this user.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount (SDF)</TableHead>
                    <TableHead className="text-right">Amount (INR)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment/Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell>{txn.date ? txn.date.toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell className="capitalize">{txn.type.replace(/_/g, ' ')}</TableCell>
                      <TableCell className={cn("text-right font-medium", txn.amount < 0 ? "text-destructive" : "text-success")}>
                        {txn.amount > 0 ? '+' : ''}{formatNumber(txn.amount, 2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {txn.type === 'redeem' ? `₹${formatNumber(txn.inrAmount || 0, 2)}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(txn.status)} className="text-xs capitalize">{txn.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">
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
