
'use client'; // Making RootLayout client component to use useAppState for theme

import type { Metadata } from 'next'; // Metadata can still be defined this way
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

// export const metadata: Metadata = { // Metadata needs to be handled differently for client components if dynamic based on state
//   title: `${CONFIG.APP_NAME} - Tap to Earn`,
//   description: `Tap to earn cryptocurrency with ${CONFIG.APP_NAME}!`,
// };
// For now, a static title can be set in Head, or dynamic title managed via useEffect

function AppBody({ children }: { children: React.ReactNode }) {
  const { userData } = useAppState();
  const activeTheme = CONFIG.APP_THEMES.find(t => t.id === userData?.activeTheme) || CONFIG.APP_THEMES[0];

  return (
    <body className={cn(
      poppins.variable,
      'font-sans antialiased flex flex-col min-h-screen',
      activeTheme.cssClass // Apply theme class
    )}>
      {children}
      <Toaster />
    </body>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* For dynamic title, you might use a client component with useEffect and document.title */}
        <title>{CONFIG.APP_NAME} - Tap, Earn, Conquer!</title>
        <meta name="description" content={`Tap to earn cryptocurrency with ${CONFIG.APP_NAME}! Conquer the leaderboards and unlock achievements.`} />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9690805652184611"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <AuthProvider>
        <AppStateProvider>
          <AppBody>{children}</AppBody>
        </AppStateProvider>
      </AuthProvider>
    </html>
  );
}
