
'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ShieldCheck, LayoutDashboard, Users, ListChecks, LogOut, Settings2, Annoyed, Gift, MessageCircleQuestion, ScrollText } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { CONFIG } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, firebaseUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sdfCoinLogoUrl = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgfE9IHbZO-d0lFy6S3f_ks7gG4Wq47ohPp45dVEssDRApAIvwVv6r8CleAyjiHOAwY8aGhdELKU4xjx0nO9w6IYuwMOryi13qE5wqzsZnFDn8ZwrSd99BlrZuDiugDiwFZ5n0usxjeNeR_I7BUTc9t4r0beiwLfKfUPhAbXPhi8VVO3MWW56bydGdxH7M/s320/file_0000000026446230b5372bc60dd219f3%20%281%29.png";


  useEffect(() => {
    if (!loading) {
      if (!user || !firebaseUser) {
        router.replace('/login');
        return;
      }
      
      firebaseUser.getIdTokenResult()
        .then((idTokenResult) => {
          if (idTokenResult.claims.admin === true) {
            setIsAdmin(true);
          } else {
            toast({
              title: 'Access Denied',
              description: 'You do not have permission to view the admin panel.',
              variant: 'destructive',
            });
            router.replace('/mining');
          }
        })
        .catch((error) => {
          console.error("Error fetching ID token result for admin check:", error);
          toast({
            title: 'Error',
            description: 'Could not verify admin status. Please try again.',
            variant: 'destructive',
          });
          router.replace('/mining');
        })
        .finally(() => {
          setIsCheckingAdmin(false);
        });
    }
  }, [user, loading, router, firebaseUser, toast]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/login');
    } catch (error: any) {
      toast({ title: 'Logout Failed', description: error.message, variant: 'destructive' });
    }
  };


  if (loading || isCheckingAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 p-4">
        <div className="w-full max-w-lg space-y-4">
          <Skeleton className="h-16 w-full rounded-lg" />
          <div className="flex gap-4">
            <Skeleton className="h-64 w-1/4 rounded-lg" />
            <Skeleton className="h-64 w-3/4 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <ShieldCheck className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
        <Link href="/mining" className="mt-6 text-primary hover:underline">
          Go to App
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20"> {/* Slightly lighter overall background */}
      <header className="bg-card border-b border-border/70 sticky top-0 z-50"> {/* Softer border */}
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2"> {/* Reduced gap */}
            <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground hover:text-primary" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Settings2 className="h-5 w-5" /> {/* Slightly smaller icon */}
            </Button>
            <Link href="/admin/dashboard" className="flex items-center gap-2.5">
              <Image src={sdfCoinLogoUrl} alt={`${CONFIG.APP_NAME} Logo`} width={28} height={28} className="rounded-full" /> {/* Slightly smaller logo */}
              <h1 className="text-lg font-semibold text-foreground">{CONFIG.APP_NAME} - Admin</h1> {/* Slightly smaller title */}
            </Link>
          </div>
          <nav className="flex items-center gap-3"> {/* Reduced gap */}
            <Link href="/mining" className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium">
              View App
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-primary text-xs font-medium">
              <LogOut className="mr-1.5 h-3.5 w-3.5" /> Logout
            </Button>
          </nav>
        </div>
      </header>

      <div className="flex-1 flex container mx-auto py-6 gap-6">
        <aside className={cn(
          "fixed inset-y-0 left-0 z-40 w-60 bg-card p-4 rounded-r-xl shadow-lg border-r border-border/70 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:rounded-xl md:shadow-lg md:border", // Enhanced shadow and rounded corners
          sidebarOpen ? "translate-x-0 pt-16 md:pt-4" : "-translate-x-full pt-4 md:pt-4" 
        )}>
          <nav className="space-y-1.5"> {/* Reduced space-y */}
            <AdminNavLink href="/admin/dashboard" icon={LayoutDashboard} onClick={() => setSidebarOpen(false)}>Dashboard</AdminNavLink>
            <AdminNavLink href="/admin/users" icon={Users} onClick={() => setSidebarOpen(false)}>Users</AdminNavLink>
            <AdminNavLink href="/admin/transactions" icon={ListChecks} onClick={() => setSidebarOpen(false)}>All Transactions</AdminNavLink>
            <AdminNavLink href="/admin/redeem-requests" icon={Gift} onClick={() => setSidebarOpen(false)}>Redeem Requests</AdminNavLink>
            <AdminNavLink href="/admin/support-tickets" icon={MessageCircleQuestion} onClick={() => setSidebarOpen(false)}>Support Tickets</AdminNavLink>
            <AdminNavLink href="/admin/marquee" icon={Annoyed} onClick={() => setSidebarOpen(false)}>Marquee Msgs</AdminNavLink>
            <AdminNavLink href="/admin/action-logs" icon={ScrollText} onClick={() => setSidebarOpen(false)}>Action Logs</AdminNavLink>
          </nav>
        </aside>

        <main className="flex-1 bg-card p-6 rounded-xl shadow-xl border border-border/60"> {/* Enhanced shadow and consistent styling */}
          {children}
        </main>
      </div>
      
      <footer className="text-center p-4 text-xs text-muted-foreground/80 border-t border-border/50 mt-auto"> {/* Softer footer */}
        &copy; {new Date().getFullYear()} {CONFIG.APP_NAME} Admin Panel. All Rights Reserved.
      </footer>
    </div>
  );
}

interface AdminNavLinkProps {
  href: string;
  icon: React.ElementType;
  children: ReactNode;
  onClick?: () => void;
}

function AdminNavLink({ href, icon: Icon, children, onClick }: AdminNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out group",
        isActive 
          ? "bg-primary/15 text-primary shadow-sm border-l-4 border-primary" 
          : "text-muted-foreground hover:bg-primary/5 hover:text-primary hover:pl-4"
      )}
    >
      <Icon className={cn("h-4.5 w-4.5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
      {children}
    </Link>
  );
}
