
'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DollarSign, Users, Activity, Settings } from 'lucide-react';

export default function AdminDashboardPage() {
  // In a real admin panel, you would fetch data here (e.g., total users, pending redemptions)

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight text-primary">Admin Dashboard</h2>
      
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
          icon={DollarSign}
          description="Requests awaiting approval"
          valueClass="text-warning"
        />
        <DashboardStatCard
          title="Total Transactions"
          value="5,678" // Placeholder
          icon={Activity}
          description="All recorded transactions"
        />
        <DashboardStatCard
          title="App Version"
          value="1.0.0" // Placeholder
          icon={Settings}
          description="Current application version"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Overview of recent important events.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {/* Placeholder for recent activity log or charts */}
            No recent critical activity to display. Real data would show new user registrations,
            large redemption requests, or system alerts.
          </p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
           {/* Add buttons for common admin tasks here if needed */}
           <p className="text-sm text-muted-foreground">Common admin tasks will appear here.</p>
        </CardContent>
      </Card>
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
    <Card className="shadow hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClass || 'text-foreground'}`}>{value}</div>
        <p className="text-xs text-muted-foreground pt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
