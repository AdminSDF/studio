
import type { ReactNode } from 'react';
import Image from 'next/image';
import { CONFIG } from '@/lib/constants';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const logoUrl = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgfE9IHbZO-d0lFy6S3f_ks7gG4Wq47ohPp45dVEssDRApAIvwVv6r8CleAyjiHOAwY8aGhdELKU4xjx0nO9w6IYuwMOryi13qE5wqzsZnFDn8ZwrSd99BlrZuDiugDiwFZ5n0usxjeNeR_I7BUTc9t4r0beiwLfKfUPhAbXPhi8VVO3MWW56bydGdxH7M/s320/file_0000000026446230b5372bc60dd219f3%20%281%29.png";
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/30 p-4">
       <Image 
        src={logoUrl}
        alt={`${CONFIG.APP_NAME} Logo`} 
        width={100}
        height={100}
        className="mb-6 rounded-full shadow-lg" 
        priority // Add priority for LCP element
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
