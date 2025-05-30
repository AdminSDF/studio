
import { Poppins } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/providers/auth-provider';
import { AppStateProvider } from '@/components/providers/app-state-provider';
import { ThemeAppContainer } from '@/components/layout/theme-app-container'; // Updated import
import { cn } from '@/lib/utils';
import Script from 'next/script';
import { CONFIG } from '@/lib/constants';
import type React from 'react';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={poppins.variable}>
      <head>
        <title>{CONFIG.APP_NAME} - Tap, Earn, Conquer!</title>
        <meta name="description" content={`Tap to earn cryptocurrency with ${CONFIG.APP_NAME}! Conquer the leaderboards and unlock achievements.`} />
        {/* AdSense script */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9690805652184611"
          crossOrigin="anonymous"
          strategy="afterInteractive" // Loads after the page becomes interactive
        />
      </head>
      <body className={cn(
        'font-sans antialiased',
        // Base body styles. Specific theme background/foreground colors will be
        // applied via CSS variables set by the activeTheme.cssClass on ThemeAppContainer's parent (html/body)
        // or on ThemeAppContainer itself if its theme class defines them directly.
         'flex flex-col min-h-screen' 
      )}>
        <AuthProvider>
          <AppStateProvider>
            <ThemeAppContainer>{children}</ThemeAppContainer>
          </AppStateProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
