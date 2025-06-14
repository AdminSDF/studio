
'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DollarSign, Users, Activity, Settings, ListChecks, AlertTriangle, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp, getCountFromServer, DocumentData } from 'firebase/firestore';
import { formatNumber } from '@/lib/utils';
import { CONFIG } from '@/lib/constants';
import { startOfMonth, endOfMonth, subDays, format, getMonth, getYear, subMonths } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

// Placeholder data for DAU chart - remains static for now
const dailyActiveUsersDataStatic = [
  { name: 'Mon', DAU: 400 },
  { name: 'Tue', DAU: 300 },
  { name: 'Wed', DAU: 500 },
  { name: 'Thu', DAU: 700 },
  { name: 'Fri', DAU: 600 },
  { name: 'Sat', DAU: 800 },
  { name: 'Sun', DAU: 750 },
];

interface ChartData {
  name: string;
  [key: string]: number | string;
}

export default function AdminDashboardPage() {
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [pendingRedemptionsCount, setPendingRedemptionsCount] = useState<number | null>(null);
  const [transactions24hCount, setTransactions24hCount] = useState<number | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number | null>(null);
  const [transactionVolumeData, setTransactionVolumeData] = useState<ChartData[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    console.log("AdminDashboard: fetchData triggered in /src/app/admin/dashboard/page.tsx. Attempting to load real data from Firestore...");
    setLoadingStats(true);
    setLoadingChart(true);
    setError(null);
    try {
      // Fetch Total Users
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getCountFromServer(usersQuery);
      setTotalUsers(usersSnapshot.data().count);

      // Fetch Pending Redemptions
      const pendingRedemptionsQuery = query(
        collection(db, "transactions"),
        where("type", "==", "redeem"),
        where("status", "==", "pending")
      );
      const pendingRedemptionsSnapshot = await getCountFromServer(pendingRedemptionsQuery);
      setPendingRedemptionsCount(pendingRedemptionsSnapshot.data().count);

      // Fetch Transactions in last 24h
      const twentyFourHoursAgo = subDays(new Date(), 1);
      const transactions24hQuery = query(
        collection(db, "transactions"),
        where("date", ">=", Timestamp.fromDate(twentyFourHoursAgo))
      );
      const transactions24hSnapshot = await getCountFromServer(transactions24hQuery);
      setTransactions24hCount(transactions24hSnapshot.data().count);

      // Fetch Monthly Revenue (sum of completed redeem INR amounts)
      const currentMonthStart = startOfMonth(new Date());
      const currentMonthEnd = endOfMonth(new Date());
      const revenueQuery = query(
        collection(db, "transactions"),
        where("type", "==", "redeem"),
        where("status", "==", "completed"),
        where("date", ">=", Timestamp.fromDate(currentMonthStart)),
        where("date", "<=", Timestamp.fromDate(currentMonthEnd))
      );
      const revenueSnapshot = await getDocs(revenueQuery);
      let totalRevenue = 0;
      revenueSnapshot.forEach(doc => {
        totalRevenue += (doc.data().inrAmount || 0);
      });
      setMonthlyRevenue(totalRevenue);
      setLoadingStats(false);

      // Fetch Transaction Volume for Chart (last 6 months, app currency)
      const monthsData: { [key: string]: number } = {};
      const monthLabels: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const targetMonth = subMonths(new Date(), i);
        const monthKey = format(targetMonth, 'yyyy-MM');
        monthsData[monthKey] = 0;
        monthLabels.push(format(targetMonth, 'MMM'));
      }

      const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
      const volumeQuery = query(
        collection(db, "transactions"),
        where("date", ">=", Timestamp.fromDate(sixMonthsAgo))
      );
      const volumeSnapshot = await getDocs(volumeQuery);
      volumeSnapshot.forEach(doc => {
        const transaction = doc.data() as DocumentData;
        const txDate = (transaction.date as Timestamp).toDate();
        const monthKey = format(txDate, 'yyyy-MM');
        if (monthsData.hasOwnProperty(monthKey)) {
          monthsData[monthKey] += (transaction.amount || 0);
        }
      });
      
      const chartDataFormatted = monthLabels.map((label, index) => {
          const yearMonthKey = format(subMonths(new Date(), 5 - index), 'yyyy-MM');
          return { name: label, Volume: monthsData[yearMonthKey] || 0 };
      });
      setTransactionVolumeData(chartDataFormatted);
      setLoadingChart(false);

    } catch (err: any) {
      console.error("Error fetching admin dashboard data:", err);
      setError(`Failed to load dashboard data. ${err.message}. Check Firestore indexes and permissions.`);
      setLoadingStats(false);
      setLoadingChart(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (error) {
    return (
      <div className="space-y-8 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Admin Dashboard</h2>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </div>
        <Card className="border-destructive bg-destructive/10">
          <CardHeader><CardTitle className="flex items-center text-destructive"><AlertTriangle className="mr-2 h-5 w-5"/>Error</CardTitle></CardHeader>
          <CardContent><p className="text-destructive">{error}</p></CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Admin Dashboard</h2>
        <Button onClick={fetchData} variant="outline" size="sm" disabled={loadingStats || loadingChart}>
          <RefreshCw className={`mr-2 h-4 w-4 ${ (loadingStats || loadingChart) ? 'animate-spin' : ''}`} /> Refresh Data
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {loadingStats ? (
          <>
            <SkeletonStatCard /> <SkeletonStatCard /> <SkeletonStatCard /> <SkeletonStatCard />
          </>
        ) : (
          <>
            <DashboardStatCard
              title="Total Users"
              value={totalUsers !== null ? formatNumber(totalUsers, 0) : 'N/A'}
              icon={Users}
              description="Number of registered users"
            />
            <DashboardStatCard
              title="Pending Redemptions"
              value={pendingRedemptionsCount !== null ? formatNumber(pendingRedemptionsCount, 0) : 'N/A'}
              icon={ListChecks}
              description="Requests awaiting approval"
              valueClass="text-warning"
            />
            <DashboardStatCard
              title="Transactions (24h)"
              value={transactions24hCount !== null ? formatNumber(transactions24hCount, 0) : 'N/A'}
              icon={Activity}
              description="Transactions in last 24 hours"
            />
            <DashboardStatCard
              title={`Revenue (${format(new Date(), 'MMM')})`}
              value={monthlyRevenue !== null ? `₹${formatNumber(monthlyRevenue)}` : 'N/A'}
              icon={DollarSign}
              description={`Approx. revenue this month from completed redemptions`}
              valueClass="text-success"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-md rounded-xl">
          <CardHeader>
            <CardTitle>Daily Active Users (DAU)</CardTitle>
            <CardDescription>Overview of user activity this week. (Static Data)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyActiveUsersDataStatic}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12}/>
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                />
                <Legend wrapperStyle={{fontSize: '12px'}} />
                <Bar dataKey="DAU" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={30}/>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-md rounded-xl">
          <CardHeader>
            <CardTitle>Transaction Volume ({CONFIG.COIN_SYMBOL})</CardTitle>
            <CardDescription>Monthly transaction totals for the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loadingChart ? (
                <div className="flex items-center justify-center h-full">
                    <Skeleton className="h-full w-full" />
                </div>
            ) : transactionVolumeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transactionVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12}
                    tickFormatter={(value) => formatNumber(value,0)} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--accent))' }}
                    formatter={(value: number) => formatNumber(value, 0)}
                  />
                  <Legend wrapperStyle={{fontSize: '12px'}} />
                  <Bar dataKey="Volume" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} barSize={30}/>
                </BarChart>
              </ResponsiveContainer>
            ) : (
                <p className="text-muted-foreground text-center pt-10">No transaction volume data available for the last 6 months.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center"><Settings className="mr-2 h-5 w-5"/>App Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Current App Version: <span className="font-semibold text-foreground">1.0.3</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Maintenance Mode: <span className="font-semibold text-success">Inactive</span>
            </p>
             <Button variant="outline" size="sm" className="mt-4">Manage Settings</Button>
          </CardContent>
        </Card>
        <Card className="shadow-md rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center"><AlertTriangle className="mr-2 h-5 w-5 text-destructive"/>System Alerts</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground">No critical system alerts at the moment.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface DashboardStatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  description: string;
  valueClass?: string;
}

function DashboardStatCard({ title, value, icon: Icon, description, valueClass }: DashboardStatCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 rounded-xl border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${valueClass || 'text-foreground'}`}>{value}</div>
        <p className="text-xs text-muted-foreground pt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function SkeletonStatCard() {
  return (
    <Card className="shadow-lg rounded-xl border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-5 w-24" /> 
        <Skeleton className="h-5 w-5 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}
    

    