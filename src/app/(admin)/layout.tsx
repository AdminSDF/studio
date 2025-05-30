
'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ShieldCheck, LayoutDashboard, Users, ListChecks } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { CONFIG } from '@/lib/constants';

// Placeholder for real admin check.
// In a real app, you'd use Firebase Custom Claims.
// For example, you might fetch the ID token result and check for a 'admin: true' claim.
// const isAdminUser = user && user.email === 'admin@example.com'; // Simple placeholder

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, firebaseUser } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login'); // Redirect to login if not authenticated
      } else {
        // Simulate checking for admin role (e.g., via custom claims)
        // Replace this with actual custom claim check
        firebaseUser?.getIdTokenResult()
          .then((idTokenResult) => {
            if (idTokenResult.claims.admin) {
              setIsAdmin(true);
            } else {
              // If not admin, redirect to main app or a 'not authorized' page
              // For now, just logging and not redirecting to allow access for demo
              console.warn("User is not an admin. Access to admin panel should be restricted.");
              // router.replace('/mining'); // Example: redirect non-admins
              setIsAdmin(true); // FOR DEMO: Allow access. REMOVE THIS IN PRODUCTION FOR NON-ADMINS.
            }
            setIsCheckingAdmin(false);
          })
          .catch(() => {
            console.error("Error fetching ID token result for admin check.");
            // router.replace('/mining'); // Handle error by redirecting
            setIsAdmin(true); // FOR DEMO: Allow access. REMOVE THIS IN PRODUCTION.
            setIsCheckingAdmin(false);
          });
      }
    }
  }, [user, loading, router, firebaseUser]);

  if (loading || isCheckingAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-16 w-full rounded-lg" />
          <div className="flex gap-4">
            <Skeleton className="h-48 w-1/4 rounded-lg" />
            <Skeleton className="h-48 w-3/4 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    // This part might not be reached if redirection happens above for non-admins
    // Or you can show a "Not Authorized" message here
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
    <div className="min-h-screen flex flex-col bg-muted/40">
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-bold text-foreground">{CONFIG.APP_NAME} - Admin Panel</h1>
          </Link>
          <nav>
            <Link href="/mining" className="text-sm text-muted-foreground hover:text-primary">
              View App
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex-1 flex container mx-auto px-0 sm:px-4 py-6 gap-6">
        <aside className="w-64 bg-card p-4 rounded-lg shadow border border-border hidden md:block">
          <nav className="space-y-2">
            <AdminNavLink href="/admin/dashboard" icon={LayoutDashboard}>Dashboard</AdminNavLink>
            <AdminNavLink href="/admin/users" icon={Users}>Users</AdminNavLink>
            <AdminNavLink href="/admin/transactions" icon={ListChecks}>Transactions</AdminNavLink>
            {/* Add more admin links here */}
          </nav>
        </aside>

        <main className="flex-1 bg-card p-6 rounded-lg shadow border border-border">
          {children}
        </main>
      </div>
      <footer className="text-center p-4 text-xs text-muted-foreground border-t border-border">
        &copy; {new Date().getFullYear()} {CONFIG.APP_NAME} Admin
      </footer>
    </div>
  );
}

interface AdminNavLinkProps {
  href: string;
  icon: React.ElementType;
  children: ReactNode;
}

function AdminNavLink({ href, icon: Icon, children }: AdminNavLinkProps) {
  const router = useRouter();
  // const isActive = router.pathname === href; // This needs usePathname for App Router
  // For simplicity, not highlighting active link for now in admin panel
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors`}
    >
      <Icon className="h-5 w-5" />
      {children}
    </Link>
  );
}
