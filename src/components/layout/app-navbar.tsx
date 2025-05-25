'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Coins, Rocket, Wallet, History, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppState } from '../providers/app-state-provider';

const navItems = [
  { href: '/mining', label: 'Mining', icon: Coins },
  { href: '/boosters', label: 'Boosters', icon: Rocket },
  { href: '/redeem', label: 'Redeem', icon: Wallet },
  { href: '/transactions', label: 'History', icon: History },
  { href: '/profile', label: 'Profile', icon: User },
];

export function AppNavbar() {
  const pathname = usePathname();
  const { addPageVisit } = useAppState();

  const handleClick = (href: string) => {
    addPageVisit(href.substring(1)); // Store page name without slash
  };

  return (
    <nav className="bg-foreground text-background p-2 border-t border-accent flex justify-around flex-shrink-0 sticky bottom-0 z-40">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            href={item.href}
            key={item.href}
            onClick={() => handleClick(item.href)}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-md text-xs w-[19%] text-center transition-colors duration-200 hover:bg-primary hover:text-primary-foreground',
              isActive ? 'bg-accent text-accent-foreground font-semibold' : 'text-muted-foreground hover:text-primary-foreground'
            )}
          >
            <item.icon className={cn("h-5 w-5", isActive ? "text-accent-foreground" : "text-muted-foreground group-hover:text-primary-foreground")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
