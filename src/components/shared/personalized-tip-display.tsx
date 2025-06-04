
'use client';

import { useEffect, useState } from 'react';
import { useAppState } from '@/components/providers/app-state-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, RefreshCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

export function PersonalizedTipDisplay() {
  const { currentPersonalizedTip, getAndSetPersonalizedTip } = useAppState();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Attempt to fetch a tip when the component mounts if one isn't already loaded.
    // The AppStateProvider handles cooldowns and probability.
    if (!currentPersonalizedTip) {
      // Set loading true only if we are actively trying to fetch
      // This avoids showing loading if a tip was already fetched or if cooldown is active
      const fetchTip = async () => {
        setIsLoading(true);
        await getAndSetPersonalizedTip();
        setIsLoading(false);
      };
      fetchTip();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount to potentially fetch initial tip

  const handleRefreshTip = async () => {
    setIsLoading(true);
    await getAndSetPersonalizedTip();
    setIsLoading(false);
  };

  if (isLoading && !currentPersonalizedTip) {
    return (
      <Card className="my-4 shadow-md rounded-xl border-border/70 bg-muted/30">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-semibold flex items-center text-primary">
            <Lightbulb className="h-4 w-4 mr-2 animate-pulse" />
            Thinking of a tip...
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <Skeleton className="h-4 w-3/4 rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (!currentPersonalizedTip) {
    // Optionally, display nothing or a very subtle placeholder if no tip is available
    // and not actively loading.
    return null; 
  }

  return (
    <Card className="my-4 shadow-lg rounded-xl border-accent/30 bg-gradient-to-r from-accent/10 via-card to-accent/10 hover:shadow-accent/20 transition-shadow duration-300">
      <CardHeader className="pb-2 pt-3 px-4 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold flex items-center text-accent">
          <Lightbulb className="h-5 w-5 mr-2" />
          Quick Tip
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={handleRefreshTip} className="h-7 w-7 text-muted-foreground hover:text-accent" aria-label="Refresh tip" disabled={isLoading}>
          <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-3 text-sm text-foreground">
        {currentPersonalizedTip}
      </CardContent>
    </Card>
  );
}
