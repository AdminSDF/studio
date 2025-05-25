'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff } from 'lucide-react';
import { useAppState } from '../providers/app-state-provider';

export function ConnectionStatusIndicator() {
  const { isOnline } = useAppState();

  return (
    <div className="fixed bottom-[calc(theme(spacing.16)_+_theme(spacing.2))] right-4 z-50"> {/* Adjusted bottom to be above navbar */}
      <Badge variant={isOnline ? 'default' : 'destructive'} className={cn(
        "transition-all duration-300",
        isOnline ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"
      )}>
        {isOnline ? <Wifi className="h-3 w-3 mr-1.5" /> : <WifiOff className="h-3 w-3 mr-1.5" />}
        {isOnline ? 'Online' : 'Offline'}
      </Badge>
    </div>
  );
}
