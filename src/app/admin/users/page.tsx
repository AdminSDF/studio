
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, AlertTriangle, RefreshCw, Eye } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp, type DocumentData } from 'firebase/firestore';
import { formatNumber } from '@/lib/utils';
import type { UserData } from '@/types';

interface UserForAdminDisplay extends Omit<Partial<UserData>, 'createdAt' | 'lastLoginBonusClaimed' | 'lastEnergyUpdate' | 'frenzyEndTime' | 'energySurgeEndTime'> {
  id: string; // UID
  createdAt?: Date | null; // Ensure this is Date or null for display
}

const ITEMS_PER_PAGE = 15; // For future pagination

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserForAdminDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [currentPage, setCurrentPage] = useState(1); // For future pagination
  // const [totalPages, setTotalPages] = useState(1); // For future pagination

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const usersCollectionRef = collection(db, 'users');
      // Consider adding pagination here in the future if user list is very large
      // For now, fetching all users, ordered by creation date
      const q = query(usersCollectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const fetchedUsers: UserForAdminDisplay[] = querySnapshot.docs.map((doc) => {
        const data = doc.data() as DocumentData;
        const createdAtTimestamp = data.createdAt as Timestamp | undefined;
        return {
          id: doc.id,
          name: data.name || 'N/A',
          email: data.email || 'N/A',
          balance: data.balance || 0,
          tapPower: data.tapPower,
          maxEnergy: data.maxEnergy,
          createdAt: createdAtTimestamp ? createdAtTimestamp.toDate() : null,
        };
      });
      
      setUsers(fetchedUsers);
      // setTotalPages(Math.ceil(fetchedUsers.length / ITEMS_PER_PAGE)); // For future pagination
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(`Failed to fetch users. ${err.message}. Ensure Firestore rules allow admin access to read the 'users' collection.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // const paginatedUsers = users.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE); // For future pagination

  if (error) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Manage Users</h2>
          <Button onClick={fetchUsers} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </div>
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-5 w-5"/>Error Fetching Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please check your Firestore security rules to ensure administrators have read access to the 'users' collection.
              Also, verify your internet connection and that Firebase services are operational.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Manage Users</h2>
        <Button onClick={fetchUsers} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Users
        </Button>
      </div>
      <Card className="shadow-md rounded-xl border-border">
        <CardHeader>
          <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/>User List</CardTitle>
          <CardDescription>View and manage application users.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
             <p className="text-muted-foreground text-center py-8">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">User ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-xs truncate max-w-[100px]">{user.id}</TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="text-right">{formatNumber(user.balance || 0, 0)}</TableCell>
                      <TableCell>{user.createdAt ? user.createdAt.toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" onClick={() => alert(`View details for ${user.name} (UID: ${user.id}) - To be implemented`)}>
                          <Eye className="mr-1.5 h-4 w-4" /> Details
                        </Button>
                        {/* Add more action buttons here later, e.g., Edit, Ban */}
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
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || loading}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || loading}>Next</Button>
        </CardFooter>
        */}
      </Card>
    </div>
  );
}
