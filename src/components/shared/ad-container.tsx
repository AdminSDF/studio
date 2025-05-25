'use client';

import { useEffect, useState } from 'react';
import { useAppState } from '@/components/providers/app-state-provider';
import { getMediatedAd } from '@/app/actions';
import type { AdContent } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

interface AdContainerProps {
  pageContext: string; // e.g., "mining", "profile" to help tailor ad request if needed
  trigger: boolean; // Prop to trigger ad fetch
}

export function AdContainer({ pageContext, trigger }: AdContainerProps) {
  const { userData, pageHistory } = useAppState();
  const [ad, setAd] = useState<AdContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAd() {
      if (!userData || !trigger) return;

      setIsLoading(true);
      setError(null);
      setAd(null);

      // Gather inputs for the AI flow
      const tappingFrequency = userData.tapCountToday; // Simple metric for now
      
      let boosterUsageDescription = "No boosters active.";
      const activeBoosters = Object.entries(userData.boostLevels || {})
        .filter(([, level]) => level > 0)
        .map(([id, level]) => `${id} (Lvl ${level})`)
        .join(', ');
      if (activeBoosters) {
        boosterUsageDescription = `Active boosters: ${activeBoosters}`;
      }
      
      const pageVisitsHistory = pageHistory.join(' -> ') || "No page visits recorded yet.";

      try {
        const result = await getMediatedAd({
          tappingFrequency,
          boosterUsage: boosterUsageDescription,
          pageVisits: pageVisitsHistory,
        });

        if ('error' in result) {
          setError(result.error);
        } else {
          setAd(result);
        }
      } catch (e) {
        console.error("Failed to fetch ad:", e);
        setError("Could not load ad at this time.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAd();
  }, [userData, pageContext, trigger, pageHistory]);

  if (isLoading) {
    return (
      <Card className="w-full my-4 mx-auto text-center bg-muted/50 p-2 border-dashed">
        <CardContent className="p-2">
          <Skeleton className="h-[50px] w-full rounded-md" />
          <Skeleton className="h-4 w-1/2 mx-auto mt-2 rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full my-4 mx-auto text-center bg-destructive/10 p-2 border-dashed border-destructive">
         <CardContent className="p-2 text-destructive flex flex-col items-center justify-center">
          <AlertCircle className="h-5 w-5 mb-1" />
          <p className="text-xs">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!ad) {
    return null; // No ad to display or not triggered
  }

  return (
    <Card className="w-full my-4 mx-auto text-center bg-card p-0 overflow-hidden shadow-md">
      <CardContent className="p-0">
        <iframe
          src={ad.adUrl}
          frameBorder="0"
          scrolling="no"
          allowFullScreen={true}
          className="w-full h-[60px] sm:h-[90px] md:h-[100px]" // Standard ad slot sizes
          title="Advertisement"
          data-ai-hint="advertisement banner"
        ></iframe>
        {/* Optionally display reason for debugging or specific UI: 
           <p className="text-xs text-muted-foreground p-1">{ad.reason}</p> 
        */}
      </CardContent>
    </Card>
  );
}
