
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircleQuestion, AlertTriangle, RefreshCw, Eye, Edit, CheckCircle, Clock, XCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp, type DocumentData, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import type { SupportTicket, AdminActionLog } from '@/types';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const cardStyle = "rounded-xl shadow-md border border-border/60 hover:border-primary/40 hover:shadow-primary/10 transition-all duration-300";

interface SupportTicketForAdmin extends Omit<SupportTicket, 'createdAt' | 'updatedAt'> {
  createdAt: Date | null;
  updatedAt?: Date | null;
}

const getStatusVariant = (status: SupportTicket['status']): "default" | "secondary" | "destructive" | "outline" | "success" => {
  switch (status) {
    case 'resolved':
    case 'closed':
      return 'success'; 
    case 'open':
      return 'destructive'; 
    case 'pending':
      return 'secondary'; 
    default:
      return 'outline';
  }
};

const getStatusTextClass = (status: SupportTicket['status']): string => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return 'text-success-foreground';
      case 'open':
        return 'text-destructive-foreground';
      case 'pending':
        return 'text-secondary-foreground';
      default:
        return 'text-muted-foreground';
    }
}

const statusOptions: SupportTicket['status'][] = ['open', 'pending', 'resolved', 'closed'];


export default function AdminSupportTicketsPage() {
  const { user: adminUser } = useAuth();
  const [tickets, setTickets] = useState<SupportTicketForAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketForAdmin | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [newStatus, setNewStatus] = useState<SupportTicket['status']>('open');
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const logAdminAction = async (actionType: AdminActionLog['actionType'], targetId: string, details: object) => {
    if (!adminUser) return;
    try {
      await addDoc(collection(db, 'admin_actions'), {
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        actionType,
        targetType: 'SUPPORT_TICKET',
        targetId,
        timestamp: serverTimestamp(),
        details,
      });
    } catch (logError) {
      console.error("Failed to log admin action:", logError);
    }
  };

  const handleOpenModal = (ticket: SupportTicketForAdmin) => {
    setSelectedTicket(ticket);
    setAdminResponse(ticket.adminResponse || '');
    setNewStatus(ticket.status);
    setIsModalOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedTicket) return;
    setUpdatingTicketId(selectedTicket.id);
    try {
      const ticketRef = doc(db, 'support_tickets', selectedTicket.id);
      const updates: Partial<SupportTicket> & {updatedAt: any} = { 
        status: newStatus, 
        adminResponse: adminResponse,
        updatedAt: serverTimestamp()
      };
      await updateDoc(ticketRef, updates); 
      toast({ title: 'Ticket Updated', description: `Ticket ${selectedTicket.id} has been updated.` });
      await logAdminAction('SUPPORT_TICKET_UPDATED', selectedTicket.id, { newStatus, adminResponse });
      fetchSupportTickets(); 
      setIsModalOpen(false);
      setSelectedTicket(null);
    } catch (err: any) {
      console.error(`Error updating ticket ${selectedTicket.id}:`, err);
      toast({ title: 'Update Failed', description: `Could not update ticket: ${err.message}`, variant: 'destructive' });
    } finally {
      setUpdatingTicketId(null);
    }
  };

  if (error) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Support Tickets</h2>
          <Button onClick={fetchSupportTickets} variant="outline" size="sm" disabled={loading}>
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
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Support Ticket Management</h2>
        <Button onClick={fetchSupportTickets} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>
      <Card className={cardStyle}>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center text-lg sm:text-xl"><MessageCircleQuestion className="mr-2 h-4.5 w-4.5 sm:h-5 sm:w-5 text-primary"/>User Support Tickets</CardTitle>
          <CardDescription className="text-xs sm:text-sm">View and manage user-submitted support tickets.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0 md:p-0">
          {loading ? (
            <div className="space-y-2 p-3 sm:p-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 sm:h-12 w-full rounded-md" />)}
            </div>
          ) : tickets.length === 0 ? (
             <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm sm:text-base">No support tickets found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] sm:text-xs uppercase text-muted-foreground px-2 sm:px-4 py-2 sm:py-3">Date</TableHead>
                    <TableHead className="text-[10px] sm:text-xs uppercase text-muted-foreground px-2 sm:px-4 py-2 sm:py-3">User</TableHead>
                    <TableHead className="text-[10px] sm:text-xs uppercase text-muted-foreground px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">Category</TableHead>
                    <TableHead className="text-[10px] sm:text-xs uppercase text-muted-foreground px-2 sm:px-4 py-2 sm:py-3">Status</TableHead>
                    <TableHead className="text-[10px] sm:text-xs uppercase text-muted-foreground px-2 sm:px-4 py-2 sm:py-3">Description</TableHead>
                    <TableHead className="text-center text-[10px] sm:text-xs uppercase text-muted-foreground px-2 sm:px-4 py-2 sm:py-3">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id} className="hover:bg-muted/40">
                      <TableCell className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">{ticket.createdAt ? ticket.createdAt.toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">
                        <div className="flex flex-col">
                          <span className="font-medium truncate max-w-[100px] sm:max-w-[150px]">{ticket.userName}</span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[100px] sm:max-w-[150px]">{ticket.userEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">{ticket.category}</TableCell>
                      <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
                        <Badge 
                            variant={getStatusVariant(ticket.status)} 
                            className={cn(
                                "text-[9px] sm:text-xs capitalize px-1.5 sm:px-2 py-0.5 sm:py-1", 
                                getStatusTextClass(ticket.status),
                                ticket.status === 'open' ? 'bg-destructive text-destructive-foreground' : '' // Specific override for 'open' to be destructive
                            )}
                        >
                          {ticket.status === 'open' ? 'Closed' : ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[10px] sm:text-xs max-w-[100px] sm:max-w-sm truncate px-2 sm:px-4 py-2 sm:py-3" title={ticket.description}>
                        {ticket.description}
                      </TableCell>
                      <TableCell className="text-center px-2 sm:px-4 py-2 sm:py-3">
                        <Button variant="outline" size="sm" className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3" onClick={() => handleOpenModal(ticket)} disabled={updatingTicketId === ticket.id}>
                          <Edit className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-3.5 sm:w-3.5" /> Manage
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

      {selectedTicket && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md md:max-w-lg rounded-xl p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Manage Support Ticket</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">Ticket ID: {selectedTicket.id}</DialogDescription>
            </DialogHeader>
            <div className="py-3 sm:py-4 space-y-3 sm:space-y-4 max-h-[60vh] overflow-y-auto px-1 text-sm sm:text-base">
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm text-muted-foreground">User: {selectedTicket.userName} ({selectedTicket.userEmail})</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Category: <Badge variant="secondary" className="capitalize text-[10px] sm:text-xs">{selectedTicket.category}</Badge></p>
                <p className="text-xs sm:text-sm text-muted-foreground">Submitted: {selectedTicket.createdAt?.toLocaleString()}</p>
              </div>
              <div>
                <Label className="font-semibold text-xs sm:text-sm">User's Issue:</Label>
                <p className="text-xs sm:text-sm p-2 bg-muted/50 rounded-md border border-border/50 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>
              <div>
                <Label htmlFor="adminResponse" className="font-semibold text-xs sm:text-sm">Admin Response:</Label>
                <Textarea 
                  id="adminResponse" 
                  value={adminResponse} 
                  onChange={(e) => setAdminResponse(e.target.value)} 
                  placeholder="Enter your response here..."
                  rows={3}
                  className="text-xs sm:text-sm"
                />
              </div>
              <div>
                <Label htmlFor="ticketStatus" className="font-semibold text-xs sm:text-sm">Update Status:</Label>
                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as SupportTicket['status'])}>
                  <SelectTrigger id="ticketStatus" className="w-full text-xs sm:text-sm">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                       <SelectItem key={status} value={status} className="capitalize text-xs sm:text-sm">
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="sm:justify-between pt-3 sm:pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" size="sm">Cancel</Button>
              </DialogClose>
              <Button type="button" onClick={handleSaveChanges} disabled={updatingTicketId === selectedTicket.id} size="sm">
                {updatingTicketId === selectedTicket.id ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
