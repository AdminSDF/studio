
'use client';

import { Poppins } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/providers/auth-provider';
import { AppStateProvider, useAppState } from '@/components/providers/app-state-provider';
import { cn } from '@/lib/utils';
import Script from 'next/script';
import { CONFIG } from '@/lib/constants';
import React from 'react';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

// This component wraps the main content and applies the dynamic theme class.
// It lives inside AppStateProvider to access theme state.
function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { userData } = useAppState();
  const activeTheme = CONFIG.APP_THEMES.find(t => t.id === userData?.activeTheme) || CONFIG.APP_THEMES[0];

  return (
    <div className={cn(
      // These classes define the main app container style and were previously on <body> in globals.css or AppBody
      'max-w-[500px] mx-auto border-l border-r border-border shadow-2xl overflow-x-hidden',
      'flex flex-col min-h-screen', // Ensures it takes full height and arranges children vertically
      activeTheme.cssClass // Apply the theme class itself
    )}>
      {children}
    </div>
  );
}


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
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9690805652184611"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={cn(
        'font-sans antialiased'
        // The bg-background and text-foreground will be applied via globals.css,
        // picking up theme variables set by ThemeWrapper's activeTheme.cssClass
      )}>
        <AuthProvider>
          <AppStateProvider>
            <ThemeWrapper>{children}</ThemeWrapper>
          </AppStateProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
