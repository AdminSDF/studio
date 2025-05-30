
'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { useAppState } from '@/components/providers/app-state-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CONFIG } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import { UserCircle, CalendarDays, TrendingUp, TrendingDown, Copy, Settings, LogOut, AlertTriangle, KeyRound, ShieldCheck } from 'lucide-react';
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
        .then(() => toast({ title: 'Copied!', description: 'Referral ID copied to clipboard.' }))
        .catch(() => toast({ title: 'Error', description: 'Failed to copy referral ID.', variant: 'destructive' }));
    }
  };

  if (loadingUserData || !userData || !authUser) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center space-x-4 p-4 bg-card rounded-xl shadow-md">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-7 w-48 rounded-md" />
            <Skeleton className="h-5 w-64 rounded-md" />
          </div>
        </div>
        {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
         <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }
  
  const joinDate = userData.createdAt ? (userData.createdAt instanceof Date ? userData.createdAt : (userData.createdAt as any).toDate()).toLocaleDateString() : 'N/A';
  const totalEarned = (userData.balance || 0) + transactions.filter(t => (t.status === 'completed' || t.status === 'pending') && t.type === 'redeem').reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawn = transactions.filter(t => t.status === 'completed' && t.type === 'redeem').reduce((sum, t) => sum + t.amount, 0);


  return (
    <div className="p-4 md:p-6 space-y-6 pb-20">
      <Card className="shadow-xl border-primary/30 rounded-xl overflow-hidden">
        <CardHeader className="flex flex-col items-center space-y-3 bg-gradient-to-br from-primary/80 to-accent/70 p-6 text-primary-foreground">
          <div className="w-24 h-24 rounded-full bg-card text-primary flex items-center justify-center text-5xl font-bold shadow-lg border-4 border-card">
            {(authUser.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="text-center">
            <CardTitle className="text-3xl font-bold">{authUser.name || 'User'}</CardTitle>
            <CardDescription className="text-primary-foreground/80 text-sm">{authUser.email}</CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-lg rounded-xl border-border">
        <CardHeader>
          <CardTitle className="text-xl flex items-center font-semibold text-foreground"><UserCircle className="mr-2.5 h-6 w-6 text-primary" /> Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between items-center p-2 hover:bg-muted/50 rounded-md transition-colors">
            <span className="flex items-center text-muted-foreground"><CalendarDays className="inline mr-2 h-4 w-4" />Joined:</span> 
            <span className="font-medium text-foreground">{joinDate}</span>
          </div>
          <div className="flex justify-between items-center p-2 hover:bg-muted/50 rounded-md transition-colors">
            <span className="flex items-center text-muted-foreground"><TrendingUp className="inline mr-2 h-4 w-4 text-success" />Total Earned (Approx.):</span> 
            <span className="font-medium text-success">{formatNumber(totalEarned)} {CONFIG.COIN_SYMBOL}</span>
          </div>
          <div className="flex justify-between items-center p-2 hover:bg-muted/50 rounded-md transition-colors">
            <span className="flex items-center text-muted-foreground"><TrendingDown className="inline mr-2 h-4 w-4 text-destructive" />Total Withdrawn:</span> 
            <span className="font-medium text-destructive">{formatNumber(totalWithdrawn)} {CONFIG.COIN_SYMBOL}</span>
          </div>
          <div className="flex justify-between items-center p-2 hover:bg-muted/50 rounded-md transition-colors">
            <span className="flex items-center text-muted-foreground"><Copy className="inline mr-2 h-4 w-4" />Referral ID:</span>
            <Button variant="ghost" size="sm" onClick={handleCopyReferral} className="font-mono bg-muted hover:bg-primary/10 hover:text-primary px-2 py-1 h-auto text-xs rounded-md">
              {authUser.id.substring(0,10)+'...'} <Copy className="ml-1.5 h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg rounded-xl border-border">
        <CardHeader>
          <CardTitle className="text-xl flex items-center font-semibold text-foreground"><Settings className="mr-2.5 h-6 w-6 text-primary" /> Security & Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handleChangePassword} variant="outline" className="w-full justify-start text-foreground hover:bg-primary/5 hover:border-primary hover:text-primary rounded-lg p-3">
            <KeyRound className="mr-3 h-5 w-5"/>Change Password
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full justify-start bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30 rounded-lg p-3">
                <AlertTriangle className="mr-3 h-5 w-5"/>Reset Account Progress
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all your mining progress, balance, and transaction history associated with your account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-md">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    await resetUserProgress();
                    setAdTrigger(prev => !prev);
                  }}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-md"
                >
                  Yes, Reset My Progress
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </CardContent>
         <CardFooter className="border-t pt-4">
            <Button onClick={handleLogout} variant="default" className="w-full justify-start bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg p-3">
              <LogOut className="mr-3 h-5 w-5"/>Logout
            </Button>
         </CardFooter>
      </Card>
      <AdContainer pageContext="profile" trigger={adTrigger} />
    </div>
  );
}
