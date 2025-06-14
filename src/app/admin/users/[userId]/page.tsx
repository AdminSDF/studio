
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCircle, AlertTriangle, RefreshCw, ArrowLeft, Wallet, Zap, Power, CalendarDays, Users, Link as LinkIcon, CheckCircle, Palette, ListChecks, Eye } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { formatNumber } from '@/lib/utils';
import type { UserData } from '@/types';
import { CONFIG } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface UserDetailDisplay extends Omit<Partial<UserData>, 'createdAt' | 'lastLoginBonusClaimed' | 'lastEnergyUpdate' | 'frenzyEndTime' | 'energySurgeEndTime'> {
  id: string;
  createdAt?: Date | null;
  lastLoginBonusClaimed?: Date | null;
  lastEnergyUpdate?: Date | null;
  frenzyEndTime?: Date | null;
  energySurgeEndTime?: Date | null;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [user, setUser] = useState<UserDetailDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data() as UserData;
        const processTimestamp = (ts: any): Date | null => {
          if (ts instanceof Timestamp) return ts.toDate();
          if (ts instanceof Date) return ts;
          return null;
        };
        setUser({
          id: userDocSnap.id,
          ...data,
          createdAt: processTimestamp(data.createdAt),
          lastLoginBonusClaimed: processTimestamp(data.lastLoginBonusClaimed),
          lastEnergyUpdate: processTimestamp(data.lastEnergyUpdate),
          frenzyEndTime: processTimestamp(data.frenzyEndTime),
          energySurgeEndTime: processTimestamp(data.energySurgeEndTime),
        });
      } else {
        setError('User not found.');
      }
    } catch (err: any) {
      console.error("Error fetching user data:", err);
      setError(`Failed to fetch user data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-64 mb-4" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
        </Button>
        <Card className="border-destructive bg-destructive/10">
          <CardHeader><CardTitle className="flex items-center text-destructive"><AlertTriangle className="mr-2 h-5 w-5"/>Error</CardTitle></CardHeader>
          <CardContent><p className="text-destructive">{error}</p></CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6 p-4">
         <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
        </Button>
        <p>User data not available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users List
          </Button>
          <h2 className="text-3xl font-bold tracking-tight text-primary flex items-center">
            <UserCircle className="mr-3 h-8 w-8"/> User Details
          </h2>
        </div>
        <Button onClick={fetchUserData} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <Card className="shadow-md rounded-xl border-border">
        <CardHeader>
          <CardTitle className="text-xl">{user.name || 'N/A'}</CardTitle>
          <CardDescription>UID: {user.id}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
          <div><strong className="text-muted-foreground">Email:</strong> {user.email || 'N/A'}</div>
          <div><strong className="text-muted-foreground">Joined:</strong> {user.createdAt ? user.createdAt.toLocaleDateString() : 'N/A'}</div>
          <div><strong className="text-muted-foreground">Last Bonus:</strong> {user.lastLoginBonusClaimed ? user.lastLoginBonusClaimed.toLocaleDateString() : 'N/A'}</div>
          
          <div className="font-semibold text-primary"><Wallet className="inline mr-1.5 h-4 w-4" />Balance: {formatNumber(user.balance || 0, 2)} {CONFIG.COIN_SYMBOL}</div>
          <div><Power className="inline mr-1.5 h-4 w-4 text-green-500" />Tap Power: {formatNumber(user.tapPower || 0, 2)}</div>
          <div><Zap className="inline mr-1.5 h-4 w-4 text-yellow-500" />Energy: {formatNumber(user.currentEnergy || 0, 0)} / {formatNumber(user.maxEnergy || 0, 0)}</div>
          <div><strong className="text-muted-foreground">Last Energy Update:</strong> {user.lastEnergyUpdate ? user.lastEnergyUpdate.toLocaleString() : 'N/A'}</div>
          
          <div><strong className="text-muted-foreground">Referrals Made:</strong> {user.referralsMadeCount || 0}</div>
          <div><strong className="text-muted-foreground">Referred By:</strong> {user.referredBy || 'N/A'}</div>

          {user.frenzyEndTime && new Date(user.frenzyEndTime) > new Date() && (
            <div className="text-orange-500 font-semibold">Frenzy Active! Ends: {new Date(user.frenzyEndTime).toLocaleTimeString()} (x{user.frenzyMultiplier})</div>
          )}
          {user.energySurgeEndTime && new Date(user.energySurgeEndTime) > new Date() && (
             <div className="text-blue-500 font-semibold">Energy Surge! Ends: {new Date(user.energySurgeEndTime).toLocaleTimeString()}</div>
          )}
        </CardContent>
        <CardFooter>
           <Button asChild variant="secondary" size="sm">
             <Link href={`/admin/users/${user.id}/transactions`}>
               <ListChecks className="mr-2 h-4 w-4" /> View Transactions
             </Link>
           </Button>
        </CardFooter>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-md rounded-xl border-border">
          <CardHeader><CardTitle className="text-lg flex items-center"><Zap className="mr-2 h-5 w-5 text-yellow-600" />Boosters</CardTitle></CardHeader>
          <CardContent>
            {CONFIG.BOOSTERS.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {CONFIG.BOOSTERS.map(b => (
                  <li key={b.id} className="flex justify-between">
                    <span>{b.name}:</span>
                    <Badge variant={(user.boostLevels?.[b.id] || 0) > 0 ? "default" : "secondary"} className="font-mono">
                      Lvl {user.boostLevels?.[b.id] || 0}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : <p className="text-muted-foreground">No boosters configured.</p>}
          </CardContent>
        </Card>

        <Card className="shadow-md rounded-xl border-border">
          <CardHeader><CardTitle className="text-lg flex items-center"><CheckCircle className="mr-2 h-5 w-5 text-green-600" />Achievements</CardTitle></CardHeader>
          <CardContent>
            {CONFIG.ACHIEVEMENTS.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {CONFIG.ACHIEVEMENTS.map(ach => (
                  <li key={ach.id} className="flex justify-between items-center">
                    <span>{ach.name}</span>
                    {user.completedAchievements?.[ach.id] ? (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">Completed</Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </li>
                ))}
              </ul>
            ) : <p className="text-muted-foreground">No achievements configured.</p>}
          </CardContent>
        </Card>

        <Card className="shadow-md rounded-xl border-border md:col-span-2">
          <CardHeader><CardTitle className="text-lg flex items-center"><Palette className="mr-2 h-5 w-5 text-purple-600" />Themes</CardTitle></CardHeader>
          <CardContent>
            {CONFIG.APP_THEMES.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {CONFIG.APP_THEMES.map(theme => (
                  <li key={theme.id} className="flex justify-between items-center">
                    <span>{theme.name}</span>
                    <div>
                      {user.activeTheme === theme.id && <Badge variant="default" className="mr-2">Active</Badge>}
                      {(user.unlockedThemes || []).includes(theme.id) ? (
                        <Badge variant="secondary" className="text-green-700 border-green-500">Unlocked</Badge>
                      ) : (
                        <Badge variant="outline">Locked</Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-muted-foreground">No themes configured.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
