
'use client'; // RootLayout is a client component to use client-side providers

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

// This component wraps the main content and applies the dynamic theme class and app container styles.
// It must be a child of AppStateProvider to use the useAppState hook.
function ThemeAppContainer({ children }: { children: React.ReactNode }) {
  const { userData } = useAppState();
  const activeTheme = CONFIG.APP_THEMES.find(t => t.id === userData?.activeTheme) || CONFIG.APP_THEMES[0];

  return (
    <div className={cn(
      // These classes define the main app container style (max-width, layout, etc.)
      'max-w-[500px] mx-auto border-l border-r border-border shadow-2xl overflow-x-hidden',
      'flex flex-col flex-grow', // Ensures it takes available vertical space if body is flex
      activeTheme.cssClass // Apply the theme CSS class itself (e.g., 'theme-crimson-fire')
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
        {/* AdSense script */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9690805652184611"
          crossOrigin="anonymous"
          strategy="afterInteractive" // Loads after the page becomes interactive
        />
      </head>
      <body className={cn(
        'font-sans antialiased'
        // Base body styles. Specific theme background/foreground colors will be
        // applied via CSS variables set by the activeTheme.cssClass on ThemeAppContainer's parent (html/body)
        // or on ThemeAppContainer itself if its theme class defines them directly.
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
