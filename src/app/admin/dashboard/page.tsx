
'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DollarSign, Users, Activity, Settings, ListChecks, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button'; // Added Button import

// Placeholder data for charts - replace with real data fetching
const dailyActiveUsersData = [
  { name: 'Mon', DAU: 400 },
  { name: 'Tue', DAU: 300 },
  { name: 'Wed', DAU: 500 },
  { name: 'Thu', DAU: 700 },
  { name: 'Fri', DAU: 600 },
  { name: 'Sat', DAU: 800 },
  { name: 'Sun', DAU: 750 },
];

const transactionVolumeData = [
  { name: 'Jan', Volume: 2400 },
  { name: 'Feb', Volume: 1398 },
  { name: 'Mar', Volume: 9800 },
  { name: 'Apr', Volume: 3908 },
  { name: 'May', Volume: 4800 },
  { name: 'Jun', Volume: 3800 },
];

export default function AdminDashboardPage() {
  // In a real admin panel, you would fetch data here
  // For example: total users, pending redemptions, transaction counts, etc.

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold tracking-tight text-primary">Admin Dashboard</h2>
      
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCard
          title="Total Users"
          value="1,234" // Placeholder
          icon={Users}
          description="Number of registered users"
        />
        <DashboardStatCard
          title="Pending Redemptions"
          value="15" // Placeholder
          icon={ListChecks}
          description="Requests awaiting approval"
          valueClass="text-warning"
        />
        <DashboardStatCard
          title="Total Transactions (24h)"
          value="256" // Placeholder
          icon={Activity}
          description="Transactions in last 24 hours"
        />
        <DashboardStatCard
          title="Revenue (Month)"
          value="₹8,500" // Placeholder
          icon={DollarSign}
          description="Approx. revenue this month"
          valueClass="text-success"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-md rounded-xl">
          <CardHeader>
            <CardTitle>Daily Active Users (DAU)</CardTitle>
            <CardDescription>Overview of user activity this week.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyActiveUsersData}>
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
            <CardTitle>Transaction Volume</CardTitle>
            <CardDescription>Monthly transaction totals.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={transactionVolumeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12}/>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--accent))' }}
                />
                <Legend wrapperStyle={{fontSize: '12px'}} />
                <Bar dataKey="Volume" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} barSize={30}/>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* System Status / Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center"><Settings className="mr-2 h-5 w-5"/>App Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Current App Version: <span className="font-semibold text-foreground">1.0.2</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Maintenance Mode: <span className="font-semibold text-success">Inactive</span>
            </p>
            {/* Placeholder for quick actions or settings toggles */}
             <Button variant="outline" size="sm" className="mt-4">Manage Settings</Button>
          </CardContent>
        </Card>
        <Card className="shadow-md rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center"><AlertTriangle className="mr-2 h-5 w-5 text-destructive"/>System Alerts</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground">No critical system alerts at the moment.</p>
             {/* Placeholder for alerts */}
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
