
'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff } from 'lucide-react';
import { useAppState } from '../providers/app-state-provider';

export function ConnectionStatusIndicator() {
  const { isOnline } = useAppState();

  return (
    <div className="fixed bottom-[calc(theme(spacing.16)_+_theme(spacing.4))] right-4 z-50"> {/* Adjusted bottom for more space from navbar */}
      <Badge variant={isOnline ? 'default' : 'destructive'} className={cn(
        "transition-all duration-300 shadow-md rounded-full text-xs px-3 py-1.5", // Made it slightly larger and rounder
        isOnline ? "bg-success text-success-foreground hover:bg-success/90" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
      )}>
        {isOnline ? <Wifi className="h-3.5 w-3.5 mr-1.5" /> : <WifiOff className="h-3.5 w-3.5 mr-1.5" />}
        {isOnline ? 'Online' : 'Offline'}
      </Badge>
    </div>
  );
}
