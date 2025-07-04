
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Coins, Rocket, Wallet, History, User, Trophy, Award, Palette, HelpCircle } from 'lucide-react'; // Added HelpCircle
import { cn } from '@/lib/utils';
import { useAppState } from '../providers/app-state-provider';

const navItems = [
  { href: '/mining', label: 'Mine', icon: Coins },
  { href: '/boosters', label: 'Boosts', icon: Rocket },
  { href: '/leaderboard', label: 'Leaders', icon: Trophy },
  { href: '/achievements', label: 'Goals', icon: Award },
  { href: '/store', label: 'Store', icon: Palette },
  { href: '/redeem', label: 'Redeem', icon: Wallet },
  { href: '/transactions', label: 'Activity', icon: History },
  { href: '/help', label: 'Help', icon: HelpCircle }, // New Help/FAQ item
  { href: '/profile', label: 'Profile', icon: User },
];

export function AppNavbar() {
  const pathname = usePathname();
  const { addPageVisit } = useAppState();

  const handleClick = (href: string) => {
    addPageVisit(href.substring(1));
  };

  // Adjust width distribution for more items
  const itemWidthClass = navItems.length > 5 ? `w-[${100 / navItems.length}%]` : 'w-[19%]';


  return (
    <nav className={cn(
      "bg-card text-foreground p-1 border-t border-border flex justify-around flex-shrink-0 sticky bottom-0 z-50",
      "shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05),0_-2px_4px_-2px_rgba(0,0,0,0.04)]" // Custom top shadow for better visual separation
      )}>
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            href={item.href}
            key={item.href}
            onClick={() => handleClick(item.href)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 p-1 rounded-lg text-xs h-14 text-center transition-all duration-200 group',
              itemWidthClass, // Apply dynamic width
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
            <span className={cn("text-[10px] leading-tight transition-colors", isActive ? "font-semibold text-primary" : "group-hover:text-primary")}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
