
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Gift, AlertTriangle, RefreshCw, CheckCircle, XCircle, UserCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, Timestamp, type DocumentData, doc, updateDoc, runTransaction, increment, serverTimestamp, addDoc } from 'firebase/firestore';
import { formatNumber } from '@/lib/utils';
import type { Transaction, PaymentDetails, AdminActionLog } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/providers/auth-provider';

const cardStyle = "rounded-xl shadow-md border border-border/60 hover:border-primary/40 hover:shadow-primary/10 transition-all duration-300";

interface RedeemRequestForAdmin extends Omit<Transaction, 'date'> {
  date: Date | null;
  userName?: string;
}

export default function AdminRedeemRequestsPage() {
  const { user: adminUser } = useAuth();
  const [requests, setRequests] = useState<RedeemRequestForAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRedeemRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const transactionsCollectionRef = collection(db, 'transactions');
      const q = query(
        transactionsCollectionRef, 
        where('type', '==', 'redeem'), 
        where('status', '==', 'pending'), 
        orderBy('date', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      const fetchedRequests: RedeemRequestForAdmin[] = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data() as DocumentData;
        const dateTimestamp = data.date as Timestamp | undefined;
        return {
          id: docSnap.id,
          ...data,
          date: dateTimestamp ? dateTimestamp.toDate() : null,
        } as RedeemRequestForAdmin;
      });
      
      setRequests(fetchedRequests);
    } catch (err: any) {
      console.error("Error fetching redeem requests:", err);
      let errMsg = `Failed to fetch redeem requests. ${err.message}.`;
      if (err.code === 'failed-precondition') {
        errMsg += " Ensure Firestore index for 'transactions' on 'type (ASC), status (ASC), date (ASC)' exists.";
      } else if (err.code === 'permission-denied') {
        errMsg += " Check Firestore security rules for admin access.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRedeemRequests();
  }, [fetchRedeemRequests]);

  const logAdminAction = async (actionType: AdminActionLog['actionType'], targetId: string, details: object) => {
    if (!adminUser) return;
    try {
      await addDoc(collection(db, 'admin_actions'), {
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        actionType,
        targetType: 'REDEEM_REQUEST',
        targetId,
        timestamp: serverTimestamp(),
        details,
      });
    } catch (logError) {
      console.error("Failed to log admin action:", logError);
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, newStatus: 'completed' | 'failed', userId: string, amount: number, currentRequest: RedeemRequestForAdmin) => {
    setUpdatingRequestId(requestId);
    try {
      const transactionRef = doc(db, 'transactions', requestId);
      const actionDetails = {
        oldStatus: currentRequest.status,
        newStatus,
        amount: currentRequest.amount,
        inrAmount: currentRequest.inrAmount,
        paymentMethod: currentRequest.paymentMethod,
        userId: currentRequest.userId,
        userName: currentRequest.userName,
      };
      
      if (newStatus === 'failed') {
        const userRef = doc(db, 'users', userId);
        await runTransaction(db, async (firestoreTransaction) => {
          const userDoc = await firestoreTransaction.get(userRef);
          if (!userDoc.exists()) throw new Error("User document not found for refund.");
          
          firestoreTransaction.update(userRef, { balance: increment(amount) });
          firestoreTransaction.update(transactionRef, { 
            status: newStatus, 
            updatedAt: serverTimestamp()
          }); 
        });
        toast({ title: 'Request Rejected', description: `Request ${requestId} marked as failed and ${formatNumber(amount)} SDF refunded to user.`, variant: 'default' });
        await logAdminAction('REDEEM_REQUEST_REJECTED', requestId, actionDetails);
      } else {
        await updateDoc(transactionRef, { 
          status: newStatus, 
          updatedAt: serverTimestamp()
        }); 
        toast({ title: 'Request Approved', description: `Request ${requestId} marked as completed.`, variant: 'default' });
        await logAdminAction('REDEEM_REQUEST_APPROVED', requestId, actionDetails);
      }
      fetchRedeemRequests(); 
    } catch (err: any) {
      console.error(`Error updating request ${requestId} to ${newStatus}:`, err);
      toast({ title: 'Update Failed', description: `Could not update request: ${err.message}`, variant: 'destructive' });
    } finally {
      setUpdatingRequestId(null);
    }
  };

  const renderPaymentDetails = (details?: PaymentDetails, method?: string) => {
    if (!details || !method) return <span className="text-muted-foreground text-xs">N/A</span>;
    const detailItems = [];
    if (details.upiId) detailItems.push(`UPI: ${details.upiId}`);
    if (details.upiName) detailItems.push(`Name: ${details.upiName}`);
    if (details.accNumber) detailItems.push(`A/C: ${details.accNumber}`);
    if (details.ifsc) detailItems.push(`IFSC: ${details.ifsc}`);
    if (details.accName) detailItems.push(`A/C Name: ${details.accName}`);
    if (details.bankName) detailItems.push(`Bank: ${details.bankName}`);
    if (details.number) detailItems.push(`${method.toUpperCase()} No: ${details.number}`);
    if (details.name && (method==='paytm' || method==='googlepay' || method==='phonepay')) detailItems.push(`Wallet Name: ${details.name}`);
    
    return detailItems.length > 0 ? <span className="text-xs">{detailItems.join(', ')}</span> : <span className="text-muted-foreground text-xs">Details Missing</span>;
  };


  if (error) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Redeem Requests</h2>
          <Button onClick={fetchRedeemRequests} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Retry
          </Button>
        </div>
        <Card className="border-destructive bg-destructive/10 rounded-xl shadow-md">
          <CardHeader><CardTitle className="flex items-center text-destructive text-lg sm:text-xl"><AlertTriangle className="mr-2 h-5 w-5"/>Error</CardTitle></CardHeader>
          <CardContent><p className="text-destructive text-sm sm:text-base">{error}</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Pending Redeem Requests</h2>
        <Button onClick={fetchRedeemRequests} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>
      <Card className={cardStyle}>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center text-lg sm:text-xl"><Gift className="mr-2 h-4.5 w-4.5 sm:h-5 sm:w-5 text-primary"/>Manage Requests</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Approve or reject pending user redeem requests.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0 md:p-0">
          {loading ? (
            <div className="space-y-2 p-3 sm:p-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 sm:h-12 w-full rounded-md" />)}
            </div>
          ) : requests.length === 0 ? (
             <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm sm:text-base">No pending redeem requests found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] sm:text-xs uppercase text-muted-foreground px-2 sm:px-4 py-2 sm:py-3">Date</TableHead>
                    <TableHead className="text-[10px] sm:text-xs uppercase text-muted-foreground px-2 sm:px-4 py-2 sm:py-3">User</TableHead>
                    <TableHead className="text-right text-[10px] sm:text-xs uppercase text-muted-foreground px-2 sm:px-4 py-2 sm:py-3">Amount (SDF)</TableHead>
                    <TableHead className="text-right text-[10px] sm:text-xs uppercase text-muted-foreground px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">Amount (INR)</TableHead>
                    <TableHead className="text-[10px] sm:text-xs uppercase text-muted-foreground px-2 sm:px-4 py-2 sm:py-3">Method</TableHead>
                    <TableHead className="text-[10px] sm:text-xs uppercase text-muted-foreground px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell">Details</TableHead>
                    <TableHead className="text-center text-[10px] sm:text-xs uppercase text-muted-foreground px-2 sm:px-4 py-2 sm:py-3">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id} className="hover:bg-muted/40">
                      <TableCell className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">{req.date ? req.date.toLocaleDateString() : 'N/A'}</TableCell>
                       <TableCell className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                           <UserCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground"/>
                           <div className="flex flex-col">
                             <span className="font-medium truncate max-w-[80px] sm:max-w-[100px]">{req.userName || 'N/A'}</span>
                             <span className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[80px] sm:max-w-[100px]">{req.userId}</span>
                           </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">{formatNumber(req.amount, 2)}</TableCell>
                      <TableCell className="text-right font-medium text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">₹{formatNumber(req.inrAmount || 0, 2)}</TableCell>
                      <TableCell className="capitalize text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">
                        <Badge variant="outline" className="text-[9px] sm:text-xs">{req.paymentMethod || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell className="text-[10px] sm:text-xs max-w-xs truncate px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell" title={renderPaymentDetails(req.paymentDetails, req.paymentMethod)?.props?.children || ''}>
                        {renderPaymentDetails(req.paymentDetails, req.paymentMethod)}
                      </TableCell>
                      <TableCell className="text-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 sm:py-3">
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="bg-success hover:bg-success/90 text-success-foreground text-[9px] sm:text-xs h-6 px-1.5 sm:h-7 sm:px-2"
                          onClick={() => handleUpdateRequestStatus(req.id, 'completed', req.userId, req.amount, req)}
                          disabled={updatingRequestId === req.id}
                        >
                          <CheckCircle className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-3.5 sm:w-3.5" /> Approve
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          className="text-[9px] sm:text-xs h-6 px-1.5 sm:h-7 sm:px-2"
                          onClick={() => handleUpdateRequestStatus(req.id, 'failed', req.userId, req.amount, req)}
                          disabled={updatingRequestId === req.id}
                        >
                          <XCircle className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-3.5 sm:w-3.5" /> Reject
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
