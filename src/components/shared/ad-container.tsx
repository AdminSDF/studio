
'use client';

import { useEffect, useState } from 'react';
import { useAppState } from '@/components/providers/app-state-provider';
import { getMediatedAd } from '@/app/actions';
import type { AdContent } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { AdSenseUnit } from './adsense-unit';
import { AdsterraScriptUnit } from './adsterra-script-unit'; // Import the new Adsterra script component

interface AdContainerProps {
  pageContext: string;
  trigger: boolean;
}

export function AdContainer({ pageContext, trigger }: AdContainerProps) {
  const { userData, pageHistory } = useAppState();
  const [ad, setAd] = useState<AdContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAd() {
      if (!userData) return; 

      setIsLoading(true);
      setError(null);
      setAd(null);

      const tappingFrequency = userData.tapCountToday;
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

    if (trigger) { 
        fetchAd();
    } else {
        setAd(null);
        setError(null);
        setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, pageContext, trigger, pageHistory]); // Removed addPageVisit from dependencies as it's stable

  if (isLoading) {
    return (
      <Card className="w-full my-4 mx-auto text-center bg-muted/50 p-2 border-dashed">
        <CardContent className="p-2">
          <Skeleton className="h-[90px] w-full rounded-md" />
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
    return null; 
  }

  return (
    <Card className="w-full my-4 mx-auto text-center bg-card p-0 overflow-hidden shadow-md">
      <CardContent className="p-0 flex justify-center items-center">
        {ad.adType === 'adsense' && ad.adClient && ad.adSlot ? (
          <AdSenseUnit
            adClient={ad.adClient}
            adSlot={ad.adSlot}
            style={{ display: 'block', margin: 'auto' }}
            className="max-w-full" 
          />
        ) : ad.adType === 'url' && ad.adUrl ? (
          <iframe
            src={ad.adUrl}
            frameBorder="0"
            scrolling="no"
            allowFullScreen={true}
            className="w-full h-[60px] sm:h-[90px] md:h-[100px]"
            title="Advertisement"
            data-ai-hint="advertisement banner"
          ></iframe>
        ) : ad.adType === 'adsterra_script' ? (
          <AdsterraScriptUnit />
        ) : (
           <div className="p-4 text-sm text-muted-foreground">Invalid ad configuration received.</div>
        )}
      </CardContent>
      {/* Optional: Display reason from AI for debugging/transparency 
      {ad.reason && <p className="text-xs text-muted-foreground p-1 bg-muted/20">{ad.reason}</p>}
      */}
    </Card>
  );
}

