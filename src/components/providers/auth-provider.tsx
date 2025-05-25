'use client';

import type { User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { usePathname, useRouter } from 'next/navigation';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  isAppReady: boolean; // True after initial auth check and user data load attempt
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setUser({
          id: fbUser.uid,
          email: fbUser.email,
          name: fbUser.displayName,
          joinDate: fbUser.metadata.creationTime ? new Date(fbUser.metadata.creationTime) : null,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
      // setIsAppReady will be set to true by AppStateProvider after data load
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading) { // Only redirect after initial auth check
      const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
      if (!user && !isAuthPage) {
        router.push('/login');
      } else if (user && isAuthPage) {
        router.push('/mining');
      }
    }
  }, [user, loading, pathname, router]);


  // isAppReady is controlled by AppStateProvider, this is just for initial auth check
  const contextValue = { user, firebaseUser, loading, isAppReady };

  if (loading && !isAppReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-1/2 mx-auto" />
        </div>
      </div>
    );
  }
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
