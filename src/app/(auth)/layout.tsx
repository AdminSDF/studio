
import type { ReactNode } from 'react';
import Image from 'next/image';
import { CONFIG } from '@/lib/constants';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/30 p-4">
       <Image 
        src="https://placehold.co/100x100.png" 
        alt={`${CONFIG.APP_NAME} Logo`} 
        width={100}
        height={100}
        className="mb-6 rounded-full shadow-lg" 
        data-ai-hint="Tap Titans circular" 
      />
      <h1 className="text-3xl font-bold text-primary mb-2">{CONFIG.APP_NAME}</h1>
      <p className="text-muted-foreground mb-8 text-center">Tap your way to riches!</p>
      <div className="w-full max-w-md bg-card p-6 sm:p-8 rounded-xl shadow-2xl border border-border">
        {children}
      </div>
       <p className="mt-10 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} {CONFIG.APP_NAME}. All rights reserved.
      </p>
    </div>
  );
}
