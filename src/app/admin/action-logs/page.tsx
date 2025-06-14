
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollText, AlertTriangle, RefreshCw } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp, type DocumentData } from 'firebase/firestore';
import type { AdminActionLog } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

const cardStyle = "rounded-xl shadow-md border border-border/60 hover:border-primary/40 hover:shadow-primary/10 transition-all duration-300";

interface AdminActionLogDisplay extends Omit<AdminActionLog, 'timestamp'> {
  timestamp: Date | null;
}

export default function AdminActionLogsPage() {
  const [logs, setLogs] = useState<AdminActionLogDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AdminActionLogDisplay | null>(null);

  const fetchActionLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const logsCollectionRef = collection(db, 'admin_actions');
      const q = query(logsCollectionRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const fetchedLogs: AdminActionLogDisplay[] = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data() as DocumentData;
        return {
          id: docSnap.id,
          ...data,
          timestamp: (data.timestamp as Timestamp)?.toDate() || null,
        } as AdminActionLogDisplay;
      });
      
      setLogs(fetchedLogs);
    } catch (err: any) {
      console.error("Error fetching admin action logs:", err);
      let errMsg = `Failed to fetch action logs. ${err.message}.`;
      if (err.code === 'failed-precondition') {
        errMsg += " Ensure Firestore index on 'admin_actions' for 'timestamp' (descending) exists.";
      } else if (err.code === 'permission-denied') {
        errMsg += " Check Firestore security rules for admin access to 'admin_actions'.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActionLogs();
  }, [fetchActionLogs]);

  if (error) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Admin Action Logs</h2>
          <Button onClick={fetchActionLogs} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Retry
          </Button>
        </div>
        <Card className="border-destructive bg-destructive/10 rounded-xl shadow-md">
          <CardHeader><CardTitle className="flex items-center text-destructive"><AlertTriangle className="mr-2 h-5 w-5"/>Error</CardTitle></CardHeader>
          <CardContent><p className="text-destructive">{error}</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Admin Action Logs</h2>
        <Button onClick={fetchActionLogs} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>
      <Card className={cardStyle}>
        <CardHeader>
          <CardTitle className="flex items-center text-xl"><ScrollText className="mr-2 h-5 w-5 text-primary"/>Activity Records</CardTitle>
          <CardDescription>Chronological log of administrative actions performed.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
            </div>
          ) : logs.length === 0 ? (
             <p className="text-muted-foreground text-center py-8">No admin actions logged yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs uppercase text-muted-foreground">Timestamp</TableHead>
                    <TableHead className="text-xs uppercase text-muted-foreground">Admin</TableHead>
                    <TableHead className="text-xs uppercase text-muted-foreground">Action Type</TableHead>
                    <TableHead className="text-xs uppercase text-muted-foreground">Target Type</TableHead>
                    <TableHead className="text-xs uppercase text-muted-foreground">Target ID</TableHead>
                    <TableHead className="text-center text-xs uppercase text-muted-foreground">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/40">
                      <TableCell className="text-sm">{log.timestamp ? log.timestamp.toLocaleString() : 'N/A'}</TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium text-foreground">{log.adminEmail}</div>
                        <div className="text-muted-foreground font-mono">{log.adminId}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs whitespace-nowrap capitalize">
                            {log.actionType.replace(/_/g, ' ').toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize text-sm">{log.targetType?.replace(/_/g, ' ').toLowerCase() || 'N/A'}</TableCell>
                      <TableCell className="text-xs font-mono truncate max-w-[100px]">{log.targetId}</TableCell>
                      <TableCell className="text-center">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-xs" onClick={() => setSelectedLog(log)}>View</Button>
                          </DialogTrigger>
                          {selectedLog && selectedLog.id === log.id && (
                            <DialogContent className="sm:max-w-md rounded-xl">
                              <DialogHeader>
                                <DialogTitle className="text-lg">Action Log Details</DialogTitle>
                                <DialogDescription className="text-xs">
                                  Log ID: {selectedLog.id}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-2 text-sm space-y-1.5 max-h-[60vh] overflow-y-auto">
                                <p><strong>Admin:</strong> {selectedLog.adminEmail} ({selectedLog.adminId})</p>
                                <p><strong>Action:</strong> <span className="capitalize">{selectedLog.actionType.replace(/_/g, ' ').toLowerCase()}</span></p>
                                <p><strong>Target:</strong> {selectedLog.targetType?.replace(/_/g, ' ').toLowerCase() || 'N/A'} - <span className="font-mono text-xs">{selectedLog.targetId}</span></p>
                                <p><strong>Timestamp:</strong> {selectedLog.timestamp?.toLocaleString()}</p>
                                <strong>Details:</strong>
                                <pre className="bg-muted p-3 rounded-md text-xs whitespace-pre-wrap border border-border/50">
                                  {JSON.stringify(selectedLog.details, null, 2)}
                                </pre>
                              </div>
                               <DialogClose asChild>
                                <Button type="button" variant="secondary" size="sm" className="mt-2">
                                  Close
                                </Button>
                              </DialogClose>
                            </DialogContent>
                          )}
                        </Dialog>
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
