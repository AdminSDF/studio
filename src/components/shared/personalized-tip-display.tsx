
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
    // Attempt to fetch/refresh a tip each time the component mounts.
    // The AppStateProvider's getAndSetPersonalizedTip handles cooldowns and probability.
    const fetchTip = async () => {
      // Set loading true only if there isn't already a tip,
      // or if we want to show loading for every potential refresh.
      // For now, let's show loading briefly for any attempt.
      setIsLoading(true);
      await getAndSetPersonalizedTip();
      setIsLoading(false);
    };
    fetchTip();
    // getAndSetPersonalizedTip is a useCallback from AppStateProvider.
    // Its dependencies include pageHistory, so its reference will change on navigation,
    // triggering this effect to run on each page that mounts this component.
  }, [getAndSetPersonalizedTip]);

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

  if (!currentPersonalizedTip && !isLoading) {
    // If no tip is available and we are not actively loading, don't render the component.
    // Or, you could return a placeholder saying "No new tips right now."
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
        {isLoading && !currentPersonalizedTip ? "Thinking of a tip..." : currentPersonalizedTip}
      </CardContent>
    </Card>
  );
}

