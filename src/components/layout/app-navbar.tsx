
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Coins, Rocket, Wallet, History, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppState } from '../providers/app-state-provider';

const navItems = [
  { href: '/mining', label: 'Mine', icon: Coins },
  { href: '/boosters', label: 'Boosts', icon: Rocket },
  { href: '/redeem', label: 'Redeem', icon: Wallet },
  { href: '/transactions', label: 'Activity', icon: History },
  { href: '/profile', label: 'Profile', icon: User },
];

export function AppNavbar() {
  const pathname = usePathname();
  const { addPageVisit } = useAppState();

  const handleClick = (href: string) => {
    addPageVisit(href.substring(1)); // Store page name without slash
  };

  return (
    <nav className="bg-card text-foreground p-2 border-t border-border flex justify-around flex-shrink-0 sticky bottom-0 z-50 shadow-top-md">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            href={item.href}
            key={item.href}
            onClick={() => handleClick(item.href)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 p-2 rounded-lg text-xs w-[19%] h-14 text-center transition-all duration-200 group',
              isActive 
                ? 'bg-primary/10 text-primary scale-105 shadow-inner' 
                : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <item.icon 
              className={cn(
                "h-5 w-5 transition-colors", 
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
              )} 
            />
            <span className={cn("transition-colors", isActive ? "font-semibold text-primary" : "group-hover:text-primary")}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
