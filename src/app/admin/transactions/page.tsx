
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ListChecks, AlertTriangle, RefreshCw, Eye, BadgeDollarSign, UserCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp, type DocumentData } from 'firebase/firestore';
import { formatNumber } from '@/lib/utils';
import type { Transaction, PaymentDetails } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 20;

interface TransactionForAdminDisplay extends Omit<Transaction, 'date'> {
  date: Date | null;
  userName?: string; // Add userName for easier display
}

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'completed': return 'default'; // Or a success-like variant if you add one
    case 'pending': return 'secondary'; // Orange/Yellowish
    case 'failed': return 'destructive';
    default: return 'outline';
  }
};

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionForAdminDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [currentPage, setCurrentPage] = useState(1); // For future pagination
  // const [totalPages, setTotalPages] = useState(1); // For future pagination

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Firestore index needed: transactions collection, field 'date' (descending).
      // Additional indexes for filtering by type or status might be useful later.
      const transactionsCollectionRef = collection(db, 'transactions');
      const q = query(transactionsCollectionRef, orderBy('date', 'desc')); // Fetch latest first
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
      // setTotalPages(Math.ceil(fetchedTransactions.length / ITEMS_PER_PAGE)); // For future pagination
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

  // const paginatedTransactions = transactions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
          <h2 className="text-3xl font-bold tracking-tight text-primary">Manage Transactions</h2>
          <Button onClick={fetchTransactions} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Retry
          </Button>
        </div>
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
        <h2 className="text-3xl font-bold tracking-tight text-primary">Transaction Management</h2>
        <Button onClick={fetchTransactions} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>
      <Card className="shadow-md rounded-xl border-border">
        <CardHeader>
          <CardTitle className="flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary"/>All Transactions</CardTitle>
          <CardDescription>View and manage application transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
            </div>
          ) : transactions.length === 0 ? (
             <p className="text-muted-foreground text-center py-8">No transactions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount (SDF)</TableHead>
                    <TableHead className="text-right">Amount (INR)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment/Details</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell>{txn.date ? txn.date.toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                           <UserCircle className="h-4 w-4 text-muted-foreground"/>
                           <div className="flex flex-col">
                             <span className="text-xs font-medium truncate max-w-[100px]">{txn.userName || 'N/A'}</span>
                             <span className="text-xs text-muted-foreground truncate max-w-[100px]">{txn.userId}</span>
                           </div>
                        </div>
                      </TableCell>
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
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" onClick={() => alert(`View details for Txn ID: ${txn.id} - To be implemented`)}>
                          <Eye className="mr-1.5 h-4 w-4" /> Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {/* Footer for future pagination
        <CardFooter className="flex justify-end space-x-2 pt-4 border-t">
           <Button variant="outline" size="sm" disabled>Previous</Button>
           <span className="text-sm text-muted-foreground">Page X of Y</span>
           <Button variant="outline" size="sm" disabled>Next</Button>
        </CardFooter>
        */}
      </Card>
    </div>
  );
}
