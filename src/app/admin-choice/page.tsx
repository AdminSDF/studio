
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CONFIG } from '@/lib/constants';
import { Home, Shield } from 'lucide-react';
import Image from 'next/image';

const ADMIN_EMAIL = 'jameafaizanrasool@gmail.com';

export default function AdminChoicePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const logoUrl = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgfE9IHbZO-d0lFy6S3f_ks7gG4Wq47ohPp45dVEssDRApAIvwVv6r8CleAyjiHOAwY8aGhdELKU4xjx0nO9w6IYuwMOryi13qE5wqzsZnFDn8ZwrSd99BlrZuDiugDiwFZ5n0usxjeNeR_I7BUTc9t4r0beiwLfKfUPhAbXPhi8VVO3MWW56bydGdxH7M/s320/file_0000000026446230b5372bc60dd219f3%20%281%29.png";


  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    } else if (!loading && user && user.email !== ADMIN_EMAIL) {
      // If user is logged in but not the admin, send to mining page
      router.replace('/mining');
    }
    // If user is the admin, do nothing here, let the component render
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <Skeleton className="h-24 w-24 rounded-full mx-auto" />
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <p className="text-center text-muted-foreground">Loading options...</p>
        </div>
      </div>
    );
  }

  // This check is after loading and ensures that if a non-admin somehow lands here
  // without being caught by useEffect (e.g. direct navigation before JS fully loads),
  // they don't see the admin options.
  if (!user || user.email !== ADMIN_EMAIL) {
    return (
       <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <Image
          src={logoUrl}
          alt={`${CONFIG.APP_NAME} Logo`}
          width={80}
          height={80}
          className="mx-auto mb-6 rounded-full shadow-lg border-2 border-primary/50"
          priority
        />
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <p className="text-center text-muted-foreground mt-4">Redirecting...</p>
      </div>
    );
  }

  // Only render options if user is the admin
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/30 p-6">
      <div className="bg-card p-8 sm:p-10 rounded-2xl shadow-2xl w-full max-w-md text-center border border-border">
        <Image
          src={logoUrl}
          alt={`${CONFIG.APP_NAME} Logo`}
          width={80}
          height={80}
          className="mx-auto mb-6 rounded-full shadow-lg border-2 border-primary/50"
          priority
        />
        <h1 className="text-3xl font-bold text-primary mb-3">Welcome, Admin!</h1>
        <p className="text-muted-foreground mb-8">
          Where would you like to go, {user.name || user.email}?
        </p>
        <div className="space-y-4">
          <Button
            onClick={() => router.push('/mining')}
            className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out"
            size="lg"
          >
            <Home className="mr-2.5 h-6 w-6" />
            Go to Main App
          </Button>
          <Button
            onClick={() => router.push('/admin/dashboard')}
            className="w-full h-14 text-lg bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out"
            size="lg"
          >
            <Shield className="mr-2.5 h-6 w-6" />
            Go to Admin Panel
          </Button>
        </div>
         <p className="mt-8 text-xs text-muted-foreground">
            Note: Access to the Admin Panel requires appropriate permissions (admin claim).
          </p>
      </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {CONFIG.APP_NAME}. All rights reserved.
        </p>
    </div>
  );
}
