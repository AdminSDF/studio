import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/providers/auth-provider';
import { AppStateProvider } from '@/components/providers/app-state-provider';
import { cn } from '@/lib/utils';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'SDF Miner - Tap to Earn',
  description: 'Tap to earn cryptocurrency with SDF Miner!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(poppins.variable, 'font-sans antialiased flex flex-col min-h-screen')}>
        <AuthProvider>
          <AppStateProvider>
            {children}
            <Toaster />
          </AppStateProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
