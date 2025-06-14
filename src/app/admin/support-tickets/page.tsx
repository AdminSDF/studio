
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircleQuestion, AlertTriangle, RefreshCw, Eye, Edit } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp, type DocumentData, doc, updateDoc, serverTimestamp } from 'firebase/firestore'; // Added serverTimestamp
import type { SupportTicket } from '@/types';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface SupportTicketForAdmin extends Omit<SupportTicket, 'createdAt' | 'updatedAt'> {
  createdAt: Date | null;
  updatedAt?: Date | null;
}

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'resolved':
    case 'closed':
      return 'default'; 
    case 'open':
      return 'destructive'; 
    case 'pending':
      return 'secondary'; 
    default:
      return 'outline';
  }
};

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicketForAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSupportTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ticketsCollectionRef = collection(db, 'support_tickets');
      const q = query(ticketsCollectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const fetchedTickets: SupportTicketForAdmin[] = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data() as DocumentData;
        return {
          id: docSnap.id,
          ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate() || null,
          updatedAt: (data.updatedAt as Timestamp)?.toDate() || null,
        } as SupportTicketForAdmin;
      });
      
      setTickets(fetchedTickets);
    } catch (err: any) {
      console.error("Error fetching support tickets:", err);
      let errMsg = `Failed to fetch support tickets. ${err.message}.`;
      if (err.code === 'failed-precondition') {
        errMsg += " Ensure Firestore index on 'support_tickets' for 'createdAt' (descending) exists.";
      } else if (err.code === 'permission-denied') {
        errMsg += " Check Firestore security rules for admin access to 'support_tickets'.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSupportTickets();
  }, [fetchSupportTickets]);

  const handleUpdateStatus = async (ticketId: string, newStatus: SupportTicket['status']) => {
    setUpdatingTicketId(ticketId);
    try {
      const ticketRef = doc(db, 'support_tickets', ticketId);
      await updateDoc(ticketRef, { status: newStatus, updatedAt: serverTimestamp() }); // Use serverTimestamp
      toast({ title: 'Status Updated', description: `Ticket ${ticketId} status updated to ${newStatus}.` });
      fetchSupportTickets(); 
    } catch (err: any) {
      console.error(`Error updating status for ticket ${ticketId}:`, err);
      toast({ title: 'Update Failed', description: `Could not update ticket status: ${err.message}`, variant: 'destructive' });
    } finally {
      setUpdatingTicketId(null);
    }
  };
  
  const viewTicketDetails = (ticket: SupportTicketForAdmin) => {
    alert(`View details for Ticket ID: ${ticket.id}\nUser: ${ticket.userName}\nCategory: ${ticket.category}\nDescription: ${ticket.description}\nStatus: ${ticket.status}\nResponse functionality to be implemented.`);
  };


  if (error) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Support Tickets</h2>
          <Button onClick={fetchSupportTickets} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Retry
          </Button>
        </div>
        <Card className="border-destructive bg-destructive/10">
          <CardHeader><CardTitle className="flex items-center text-destructive"><AlertTriangle className="mr-2 h-5 w-5"/>Error</CardTitle></CardHeader>
          <CardContent><p className="text-destructive">{error}</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Support Ticket Management</h2>
        <Button onClick={fetchSupportTickets} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>
      <Card className="shadow-md rounded-xl border-border">
        <CardHeader>
          <CardTitle className="flex items-center"><MessageCircleQuestion className="mr-2 h-5 w-5 text-primary"/>User Support Tickets</CardTitle>
          <CardDescription>View and manage user-submitted support tickets.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
            </div>
          ) : tickets.length === 0 ? (
             <p className="text-muted-foreground text-center py-8">No support tickets found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description (Summary)</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>{ticket.createdAt ? ticket.createdAt.toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium">{ticket.userName}</span>
                          <span className="text-xs text-muted-foreground">{ticket.userEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{ticket.category}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(ticket.status)} className="text-xs capitalize">{ticket.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-sm truncate" title={ticket.description}>
                        {ticket.description}
                      </TableCell>
                      <TableCell className="text-center space-x-1">
                        <Button variant="outline" size="sm" onClick={() => viewTicketDetails(ticket)}>
                          <Eye className="mr-1 h-3 w-3" /> Details
                        </Button>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => {
                                const newStatus = prompt(`Update status for ${ticket.id} (current: ${ticket.status}). Enter new status (open, pending, resolved, closed):`, ticket.status) as SupportTicket['status'] | null;
                                if (newStatus && ['open', 'pending', 'resolved', 'closed'].includes(newStatus)) {
                                    handleUpdateStatus(ticket.id, newStatus);
                                } else if (newStatus !== null) {
                                    toast({title: "Invalid Status", description: "Please enter a valid status.", variant: "destructive"});
                                }
                            }}
                            disabled={updatingTicketId === ticket.id}
                            className="text-xs"
                        >
                          <Edit className="mr-1 h-3 w-3" /> Status
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

