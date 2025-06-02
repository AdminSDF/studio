
import type { ReactNode } from 'react';
import Image from 'next/image';
import { CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const logoUrl = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgfE9IHbZO-d0lFy6S3f_ks7gG4Wq47ohPp45dVEssDRApAIvwVv6r8CleAyjiHOAwY8aGhdELKU4xjx0nO9w6IYuwMOryi13qE5wqzsZnFDn8ZwrSd99BlrZuDiugDiwFZ5n0usxjeNeR_I7BUTc9t4r0beiwLfKfUPhAbXPhi8VVO3MWW56bydGdxH7M/s320/file_0000000026446230b5372bc60dd219f3%20%281%29.png";
  return (
    <div className={cn(
        "flex flex-col items-center justify-center min-h-screen p-6 sm:p-8 md:p-12",
        "animated-auth-background" 
      )}
    >
       <Image 
        src={logoUrl}
        alt={`${CONFIG.APP_NAME} Logo`} 
        width={120} // Slightly larger logo
        height={120}
        className="mb-6 rounded-full shadow-2xl border-4 border-card/60 hover:scale-105 transition-transform duration-300 ease-in-out animate-fadeInSlideUp" 
        style={{ animationDelay: '0s' }} // Logo fades in first
        priority 
      />
      <h1 className="text-4xl font-bold text-primary mb-3 animate-subtle-glow animate-fadeInSlideUp" style={{ animationDelay: '0.1s' }}>
        {CONFIG.APP_NAME}
      </h1>
      <p className="text-muted-foreground mb-10 text-center text-lg animate-delayedFadeIn-tagline">
        Tap your way to riches!
      </p>
      <div className="w-full max-w-md bg-card p-6 sm:p-10 rounded-2xl shadow-2xl border border-border/70 animate-fadeInSlideUp" style={{ animationDelay: '0.2s' }}>
        {children}
      </div>
       <p className="mt-12 text-center text-xs text-muted-foreground animate-delayedFadeIn-copyright">
        &copy; {new Date().getFullYear()} {CONFIG.APP_NAME}. All rights reserved.
      </p>
    </div>
  );
}

