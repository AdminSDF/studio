import type { ReactNode } from 'react';
import Image from 'next/image';
import { CONFIG } from '@/lib/constants';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
       <Image src="https://placehold.co/100x100.png" alt={`${CONFIG.APP_NAME} Logo`} width={80} height={80} className="mb-6 rounded-full" data-ai-hint="logo coin" />
      <div className="w-full max-w-md bg-card p-6 sm:p-8 rounded-xl shadow-2xl border">
        {children}
      </div>
       <p className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} {CONFIG.APP_NAME}. All rights reserved.
      </p>
    </div>
  );
}
