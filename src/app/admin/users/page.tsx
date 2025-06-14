
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
import Link from 'next/link';

interface UserForAdminDisplay extends Omit<Partial<UserData>, 'createdAt' | 'lastLoginBonusClaimed' | 'lastEnergyUpdate' | 'frenzyEndTime' | 'energySurgeEndTime'> {
  id: string; 
  createdAt?: Date | null; 
}

const ITEMS_PER_PAGE = 15; 
const cardStyle = "rounded-xl shadow-md border border-border/60 hover:border-primary/40 hover:shadow-primary/10 transition-all duration-300";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserForAdminDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const usersCollectionRef = collection(db, 'users');
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

  if (error) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Manage Users</h2>
          <Button onClick={fetchUsers} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </div>
        <Card className="border-destructive bg-destructive/10 rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive text-lg sm:text-xl">
              <AlertTriangle className="mr-2 h-5 w-5"/>Error Fetching Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive text-sm sm:text-base">{error}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Please check your Firestore security rules to ensure administrators have read access to the 'users' collection.
              Also, verify your internet connection and that Firebase services are operational.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">User Management</h2>
        <Button onClick={fetchUsers} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      <Card className={cardStyle}>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center text-lg sm:text-xl"><Users className="mr-2 h-4.5 w-4.5 sm:h-5 sm:w-5 text-primary"/>User List</CardTitle>
          <CardDescription className="text-xs sm:text-sm">View and manage application users.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0 md:p-0">
          {loading ? (
            <div className="space-y-3 p-3 sm:p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 sm:space-x-4 p-2">
                  <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-3.5 sm:h-4 w-3/4" />
                    <Skeleton className="h-2.5 sm:h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-7 w-16 sm:h-8 sm:w-20 rounded-md" /> 
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
             <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm sm:text-base">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px] sm:w-[150px] text-[10px] sm:text-xs uppercase text-muted-foreground px-2 sm:px-4 py-2 sm:py-3">User ID</TableHead>
                    <TableHead className="text-[10px] sm:text-xs uppercase text-muted-foreground px-2 sm:px-4 py-2 sm:py-3">Name</TableHead>
                    <TableHead className="hidden md:table-cell text-[10px] sm:text-xs uppercase text-muted-foreground px-2 sm:px-4 py-2 sm:py-3">Email</TableHead>
                    <TableHead className="text-right text-[10px] sm:text-xs uppercase text-muted-foreground px-2 sm:px-4 py-2 sm:py-3">Balance (SDF)</TableHead>
                    <TableHead className="hidden sm:table-cell text-[10px] sm:text-xs uppercase text-muted-foreground px-2 sm:px-4 py-2 sm:py-3">Joined</TableHead>
                    <TableHead className="text-center text-[10px] sm:text-xs uppercase text-muted-foreground px-2 sm:px-4 py-2 sm:py-3">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-[10px] sm:text-xs truncate max-w-[80px] sm:max-w-[100px] px-2 sm:px-4 py-2 sm:py-3">{user.id}</TableCell>
                      <TableCell className="font-medium text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 truncate max-w-[100px] sm:max-w-[150px]">{user.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 truncate max-w-[150px]">{user.email}</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">{formatNumber(user.balance || 0, 0)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">{user.createdAt ? user.createdAt.toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell className="text-center px-2 sm:px-4 py-2 sm:py-3">
                        <Button asChild variant="outline" size="sm" className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3">
                          <Link href={`/admin/users/${user.id}`}>
                            <Eye className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-3.5 sm:w-3.5" /> View
                          </Link>
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
