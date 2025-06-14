
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ListChecks, AlertTriangle, RefreshCw, Eye, UserCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp, type DocumentData } from 'firebase/firestore';
import { formatNumber } from '@/lib/utils';
import type { Transaction, PaymentDetails } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 20;
const cardStyle = "rounded-xl shadow-md border border-border/60 hover:border-primary/40 hover:shadow-primary/10 transition-all duration-300";

interface TransactionForAdminDisplay extends Omit<Transaction, 'date'> {
  date: Date | null;
  userName?: string; 
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


export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionForAdminDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const transactionsCollectionRef = collection(db, 'transactions');
      const q = query(transactionsCollectionRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const fetchedTransactions: TransactionForAdminDisplay[] = querySnapshot.docs.map((doc) => {
        const data = doc.data() as DocumentData;
        const dateTimestamp = data.date as Timestamp | undefined;
        return {
          id: doc.id,
          ...data,
          date: dateTimestamp ? dateTimestamp.toDate() : null,
        } as TransactionForAdminDisplay;
      });
      
      setTransactions(fetchedTransactions);
    } catch (err: any) {
      console.error("Error fetching transactions:", err);
      let errMsg = `Failed to fetch transactions. ${err.message}.`;
      if (err.code === 'failed-precondition') {
        errMsg += " Ensure Firestore index on 'transactions' collection for 'date' (descending) exists.";
      } else if (err.code === 'permission-denied') {
        errMsg += " Check Firestore security rules for admin access to 'transactions' collection.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Manage Transactions</h2>
          <Button onClick={fetchTransactions} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Retry
          </Button>
        </div>
        <Card className="border-destructive bg-destructive/10 rounded-xl shadow-md">
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Transaction Management</h2>
        <Button onClick={fetchTransactions} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>
      <Card className={cardStyle}>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center text-lg sm:text-xl"><ListChecks className="mr-2 h-4.5 w-4.5 sm:h-5 sm:w-5 text-primary"/>All Transactions</CardTitle>
          <CardDescription className="text-xs sm:text-sm">View and manage application transactions.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0 md:p-0">
          {loading ? (
            <div className="space-y-2 p-3 sm:p-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 sm:h-12 w-full rounded-md" />)}
            </div>
          ) : transactions.length === 0 ? (
             <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm sm:text-base">No transactions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] sm:text-xs uppercase text-muted-foreground px-2 sm:px-4 py-2 sm:py-3">Date</TableHead>
                    <TableHead className="text-[10px] sm:text-xs uppercase text-muted-foreground px-2 sm:px-4 py-2 sm:py-3">User</TableHead>
                    <TableHead className="text-[10px] sm:text-xs uppercase text-muted-foreground px-2 sm:px-4 py-2 sm:py-3">Type</TableHead>
                    <TableHead className="text-right text-[10px] sm:text-xs uppercase text-muted-foreground px-2 sm:px-4 py-2 sm:py-3">Amount (SDF)</TableHead>
                    <TableHead className="text-right text-[10px] sm:text-xs uppercase text-muted-foreground px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">Amount (INR)</TableHead>
                    <TableHead className="text-[10px] sm:text-xs uppercase text-muted-foreground px-2 sm:px-4 py-2 sm:py-3">Status</TableHead>
                    <TableHead className="text-[10px] sm:text-xs uppercase text-muted-foreground px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell">Payment/Details</TableHead>
                    <TableHead className="text-center text-[10px] sm:text-xs uppercase text-muted-foreground px-2 sm:px-4 py-2 sm:py-3">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.id} className="hover:bg-muted/40">
                      <TableCell className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">{txn.date ? txn.date.toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                           <UserCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground"/>
                           <div className="flex flex-col">
                             <span className="font-medium truncate max-w-[80px] sm:max-w-[100px]">{txn.userName || 'N/A'}</span>
                             <span className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[80px] sm:max-w-[100px]">{txn.userId}</span>
                           </div>
                        </div>
                      </TableCell>
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
                      <TableCell className="text-[10px] sm:text-xs max-w-[150px] sm:max-w-[200px] truncate px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell" title={txn.type === 'redeem' ? renderPaymentDetails(txn.paymentDetails, txn.paymentMethod) : txn.details || 'N/A'}>
                        {txn.type === 'redeem' ? renderPaymentDetails(txn.paymentDetails, txn.paymentMethod) : txn.details || 'N/A'}
                      </TableCell>
                      <TableCell className="text-center px-2 sm:px-4 py-2 sm:py-3">
                        <Button variant="outline" size="sm" className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3" onClick={() => alert(`View details for Txn ID: ${txn.id} - To be implemented`)}>
                          <Eye className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-3.5 sm:w-3.5" /> Details
                        </Button>
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
