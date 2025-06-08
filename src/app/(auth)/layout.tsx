
'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect, type ReactNode } from 'react';
import Image from 'next/image';
import { CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setIsFlipped(pathname.startsWith('/register'));
  }, [pathname]);

  const logoUrl = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgfE9IHbZO-d0lFy6S3f_ks7gG4Wq47ohPp45dVEssDRApAIvwVv6r8CleAyjiHOAwY8aGhdELKU4xjx0nO9w6IYuwMOryi13qE5wqzsZnFDn8ZwrSd99BlrZuDiugDiwFZ5n0usxjeNeR_I7BUTc9t4r0beiwLfKfUPhAbXPhi8VVO3MWW56bydGdxH7M/s320/file_0000000026446230b5372bc60dd219f3%20%281%29.png";
  
  const cardMinHeight = "min-h-[560px] sm:min-h-[600px]"; // Reduced min height

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-10", 
        "animated-auth-background"
      )}
    >
      <Image
        src={logoUrl}
        alt={`${CONFIG.APP_NAME} Logo`}
        width={100} 
        height={100}
        className="mb-4 rounded-full shadow-2xl border-4 border-card/60 hover:scale-105 transition-transform duration-300 ease-in-out animate-fadeInSlideUp"
        style={{ animationDelay: '0s' }}
        priority
      />
      <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2 animate-subtle-glow animate-fadeInSlideUp" style={{ animationDelay: '0.1s' }}>
        {CONFIG.APP_NAME}
      </h1>
      <p className="text-muted-foreground mb-6 text-center text-md sm:text-lg animate-delayedFadeIn-tagline">
        Tap your way to riches!
      </p>

      {/* Removed max-w-md from auth-flip-container and added responsive padding */}
      <div className={cn("w-full auth-flip-container animate-fadeInSlideUp px-4 sm:px-0", cardMinHeight)} style={{ animationDelay: '0.2s' }}>
        <div className={cn("auth-flip-card", isFlipped ? "is-flipped" : "", cardMinHeight)}>
          <div className="auth-card-face auth-card-front">
            <div className="bg-card p-6 sm:p-8 rounded-2xl shadow-2xl border border-border/70 w-full max-w-md mx-auto">
              <LoginForm />
            </div>
          </div>
          <div className="auth-card-face auth-card-back">
            <div className="bg-card p-6 sm:p-8 rounded-2xl shadow-2xl border border-border/70 w-full max-w-md mx-auto">
              <RegisterForm />
            </div>
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-center text-xs text-muted-foreground animate-delayedFadeIn-copyright">
        &copy; {new Date().getFullYear()} {CONFIG.APP_NAME}. All rights reserved.
      </p>
    </div>
  );
}
