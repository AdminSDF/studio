
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCircle, AlertTriangle, RefreshCw, ArrowLeft, Wallet, Zap, Power, CalendarDays, Users as UsersIcon, Link as LinkIcon, CheckCircle, Palette, ListChecks, Eye, BarChartBig } from 'lucide-react';
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

const cardStyle = "rounded-xl shadow-md border border-border/60 hover:border-primary/40 hover:shadow-primary/10 transition-all duration-300";
const detailItemClass = "flex justify-between items-center py-1.5 sm:py-2 px-2 sm:px-3 hover:bg-muted/30 rounded-md transition-colors";
const detailLabelClass = "flex items-center text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider";
const detailValueClass = "font-medium text-foreground text-xs sm:text-sm";

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
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4">
        <Skeleton className="h-7 sm:h-8 w-24 sm:w-32 rounded-md" />
        <Skeleton className="h-8 sm:h-10 w-48 sm:w-64 mb-3 sm:mb-4 rounded-md" />
        <div className="grid md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          <Skeleton className="h-40 sm:h-48 w-full rounded-xl" />
          <Skeleton className="h-40 sm:h-48 w-full rounded-xl" />
          <Skeleton className="h-28 sm:h-32 w-full rounded-xl" />
          <Skeleton className="h-28 sm:h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-3 sm:mb-4 text-xs sm:text-sm">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Users
        </Button>
        <Card className="border-destructive bg-destructive/10 rounded-xl shadow-md">
          <CardHeader><CardTitle className="flex items-center text-destructive text-lg sm:text-xl"><AlertTriangle className="mr-2 h-5 w-5"/>Error</CardTitle></CardHeader>
          <CardContent><p className="text-destructive text-sm sm:text-base">{error}</p></CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4">
         <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-3 sm:mb-4 text-xs sm:text-sm">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Users
        </Button>
        <p className="text-sm sm:text-base">User data not available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-1.5 sm:mb-2 text-[10px] sm:text-xs">
            <ArrowLeft className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-3.5 sm:w-3.5" /> Back to Users List
          </Button>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center">
            <UserCircle className="mr-2 sm:mr-3 h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary"/> User Profile
          </h2>
        </div>
        <Button onClick={fetchUserData} variant="outline" size="sm" disabled={loading} className="text-xs sm:text-sm">
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <Card className={cardStyle}>
        <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-4 md:p-6">
          <CardTitle className="text-xl sm:text-2xl text-primary">{user.name || 'N/A'}</CardTitle>
          <CardDescription className="text-[10px] sm:text-xs font-mono">UID: {user.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm p-3 sm:p-4 md:p-6 pt-0">
          <div className={detailItemClass}><span className={detailLabelClass}>Email:</span> <span className={`${detailValueClass} truncate max-w-[150px] sm:max-w-xs`}>{user.email || 'N/A'}</span></div>
          <div className={detailItemClass}><span className={detailLabelClass}><CalendarDays className="inline mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4"/>Joined:</span> <span className={detailValueClass}>{user.createdAt ? user.createdAt.toLocaleDateString() : 'N/A'}</span></div>
          <div className={detailItemClass}><span className={detailLabelClass}><CalendarDays className="inline mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4"/>Last Bonus:</span> <span className={detailValueClass}>{user.lastLoginBonusClaimed ? user.lastLoginBonusClaimed.toLocaleDateString() : 'N/A'}</span></div>
          
          <div className={detailItemClass}><span className={detailLabelClass}><Wallet className="inline mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-success"/>Balance:</span> <span className={`${detailValueClass} text-success`}>{formatNumber(user.balance || 0, 2)} {CONFIG.COIN_SYMBOL}</span></div>
          <div className={detailItemClass}><span className={detailLabelClass}><Power className="inline mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent"/>Tap Power:</span> <span className={detailValueClass}>{formatNumber(user.tapPower || 0, 2)}</span></div>
          <div className={detailItemClass}><span className={detailLabelClass}><Zap className="inline mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-warning"/>Energy:</span> <span className={detailValueClass}>{formatNumber(user.currentEnergy || 0, 0)} / {formatNumber(user.maxEnergy || 0, 0)}</span></div>
          <div className={`${detailItemClass} flex-col sm:flex-row items-start sm:items-center`}><span className={detailLabelClass}>Last Energy Update:</span> <span className={`${detailValueClass} mt-0.5 sm:mt-0`}>{user.lastEnergyUpdate ? user.lastEnergyUpdate.toLocaleString() : 'N/A'}</span></div>
          
          <div className={detailItemClass}><span className={detailLabelClass}><UsersIcon className="inline mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4"/>Referrals Made:</span> <span className={detailValueClass}>{user.referralsMadeCount || 0}</span></div>
          <div className={detailItemClass}><span className={detailLabelClass}><LinkIcon className="inline mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4"/>Referred By:</span> <span className={`${detailValueClass} font-mono text-[10px] sm:text-xs truncate max-w-[150px] sm:max-w-xs`}>{user.referredBy || 'N/A'}</span></div>

          {user.frenzyEndTime && new Date(user.frenzyEndTime) > new Date() && (
            <div className="text-orange-500 font-semibold p-1.5 sm:p-2 bg-orange-500/10 rounded-md text-[10px] sm:text-xs">Frenzy Active! Ends: {new Date(user.frenzyEndTime).toLocaleTimeString()} (x{user.frenzyMultiplier})</div>
          )}
          {user.energySurgeEndTime && new Date(user.energySurgeEndTime) > new Date() && (
             <div className="text-blue-500 font-semibold p-1.5 sm:p-2 bg-blue-500/10 rounded-md text-[10px] sm:text-xs">Energy Surge! Ends: {new Date(user.energySurgeEndTime).toLocaleTimeString()}</div>
          )}
        </CardContent>
        <CardFooter className="border-t border-border/50 pt-3 sm:pt-4 p-3 sm:p-4 md:p-6">
           <Button asChild variant="secondary" size="sm" className="text-xs sm:text-sm">
             <Link href={`/admin/users/${user.id}/transactions`}>
               <ListChecks className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> View Transactions
             </Link>
           </Button>
        </CardFooter>
      </Card>

      <div className="grid md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        <Card className={cardStyle}>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4"><CardTitle className="text-base sm:text-lg flex items-center"><BarChartBig className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary" />Boosters</CardTitle></CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            {CONFIG.BOOSTERS.length > 0 ? (
              <ul className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm">
                {CONFIG.BOOSTERS.map(b => (
                  <li key={b.id} className={detailItemClass}>
                    <span className="truncate max-w-[100px] sm:max-w-none">{b.name}:</span>
                    <Badge variant={(user.boostLevels?.[b.id] || 0) > 0 ? "default" : "secondary"} className="font-mono text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5">
                      Lvl {user.boostLevels?.[b.id] || 0}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : <p className="text-muted-foreground text-xs sm:text-sm">No boosters configured.</p>}
          </CardContent>
        </Card>

        <Card className={cardStyle}>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4"><CardTitle className="text-base sm:text-lg flex items-center"><CheckCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-success" />Achievements</CardTitle></CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            {CONFIG.ACHIEVEMENTS.length > 0 ? (
              <ul className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm">
                {CONFIG.ACHIEVEMENTS.map(ach => (
                  <li key={ach.id} className={detailItemClass}>
                    <span className="truncate max-w-[100px] sm:max-w-none">{ach.name}</span>
                    {user.completedAchievements?.[ach.id] ? (
                      <Badge variant="default" className="bg-success/80 hover:bg-success/90 text-success-foreground text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5">Completed</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5">Pending</Badge>
                    )}
                  </li>
                ))}
              </ul>
            ) : <p className="text-muted-foreground text-xs sm:text-sm">No achievements configured.</p>}
          </CardContent>
        </Card>

        <Card className={`${cardStyle} md:col-span-2`}>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4"><CardTitle className="text-base sm:text-lg flex items-center"><Palette className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-accent" />Themes</CardTitle></CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            {CONFIG.APP_THEMES.length > 0 ? (
              <ul className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm">
                {CONFIG.APP_THEMES.map(theme => (
                  <li key={theme.id} className={detailItemClass}>
                    <span className="truncate max-w-[100px] sm:max-w-none">{theme.name}</span>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {user.activeTheme === theme.id && <Badge variant="default" className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5">Active</Badge>}
                      {(user.unlockedThemes || []).includes(theme.id) ? (
                        <Badge variant="secondary" className="text-success-foreground bg-success/70 text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5">Unlocked</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5">Locked</Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-muted-foreground text-xs sm:text-sm">No themes configured.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
