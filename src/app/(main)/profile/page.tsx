'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { useAppState } from '@/components/providers/app-state-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CONFIG } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import { UserCircle, CalendarDays, TrendingUp, TrendingDown, Copy, Settings, LogOut, AlertTriangle, KeyRound } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { updatePassword } from 'firebase/auth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AdContainer } from '@/components/shared/ad-container';
import { useState } from 'react';

export default function ProfilePage() {
  const { user: authUser, firebaseUser } = useAuth();
  const { userData, transactions, resetUserProgress, loadingUserData } = useAppState();
  const { toast } = useToast();
  const [adTrigger, setAdTrigger] = useState(false);


  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      // AuthProvider will handle redirect
      setAdTrigger(prev => !prev);
    } catch (error: any) {
      toast({ title: 'Logout Failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleChangePassword = async () => {
    if (!firebaseUser) return;
    const newPassword = prompt("Enter your new password (min 6 characters):");
    if (!newPassword) return;
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    try {
      await updatePassword(firebaseUser, newPassword);
      toast({ title: "Success", description: "Password changed successfully!" });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to change password: " + error.message, variant: "destructive" });
      if (error.code === 'auth/requires-recent-login') {
        toast({ title: "Action Required", description: "Please log out and log back in to change your password.", variant: "destructive", duration: 5000 });
      }
    }
  };
  
  const handleCopyReferral = () => {
    if (authUser?.id) {
      navigator.clipboard.writeText(authUser.id)
        .then(() => toast({ title: 'Copied!', description: 'Referral code copied to clipboard.' }))
        .catch(() => toast({ title: 'Error', description: 'Failed to copy referral code.', variant: 'destructive' }));
    }
  };

  if (loadingUserData || !userData || !authUser) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-52" />
          </div>
        </div>
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
    );
  }
  
  const joinDate = userData.createdAt ? (userData.createdAt instanceof Date ? userData.createdAt : (userData.createdAt as any).toDate()).toLocaleDateString() : 'N/A';
  const totalEarned = (userData.balance || 0) + transactions.filter(t => (t.status === 'completed' || t.status === 'pending') && t.type === 'redeem').reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawn = transactions.filter(t => t.status === 'completed' && t.type === 'redeem').reduce((sum, t) => sum + t.amount, 0);


  return (
    <div className="p-4 md:p-6 space-y-6 pb-20">
      <Card className="shadow-lg border-primary">
        <CardHeader className="flex flex-row items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold">
            {(authUser.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <CardTitle className="text-2xl text-primary">{authUser.name || 'User'}</CardTitle>
            <CardDescription>{authUser.email}</CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center"><UserCircle className="mr-2 text-accent" /> Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span><CalendarDays className="inline mr-1.5 h-4 w-4 text-muted-foreground" />Joined:</span> <span className="font-medium">{joinDate}</span></div>
          <div className="flex justify-between"><span><TrendingUp className="inline mr-1.5 h-4 w-4 text-success" />Total Earned (Approx.):</span> <span className="font-medium">{formatNumber(totalEarned)} {CONFIG.COIN_SYMBOL}</span></div>
          <div className="flex justify-between"><span><TrendingDown className="inline mr-1.5 h-4 w-4 text-destructive" />Total Withdrawn:</span> <span className="font-medium">{formatNumber(totalWithdrawn)} {CONFIG.COIN_SYMBOL}</span></div>
          <div className="flex justify-between items-center">
            <span><Copy className="inline mr-1.5 h-4 w-4 text-muted-foreground" />Referral Code:</span>
            <Button variant="ghost" size="sm" onClick={handleCopyReferral} className="font-mono bg-muted hover:bg-muted/80 px-2 py-0.5 h-auto text-xs">
              {authUser.id.substring(0,12)+'...'} <Copy className="ml-2 h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center"><Settings className="mr-2 text-accent" /> Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handleChangePassword} variant="outline" className="w-full justify-start"><KeyRound className="mr-2 h-4 w-4"/>Change Password</Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full justify-start"><AlertTriangle className="mr-2 h-4 w-4"/>Reset Account Progress</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all your mining progress, balance, and transaction history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    await resetUserProgress();
                    setAdTrigger(prev => !prev);
                  }}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  Yes, Reset My Progress
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button onClick={handleLogout} variant="default" className="w-full justify-start bg-primary hover:bg-primary/90">
            <LogOut className="mr-2 h-4 w-4"/>Logout
          </Button>
        </CardContent>
      </Card>
      <AdContainer pageContext="profile" trigger={adTrigger} />
    </div>
  );
}
