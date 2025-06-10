
'use client';

import { useEffect, useState, useMemo } from 'react';
import type { AdContent } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
// import { AdSenseUnit } from './adsense-unit'; // AdSenseUnit is no longer used
import { AdsterraScriptUnit } from './adsterra-script-unit';
import { CONFIG } from '@/lib/constants';

interface AdContainerProps {
  pageContext: string;
  trigger: boolean;
}

// List of predefined ads. AI mediation is disabled.
// Removed AdSense ad type and Adsterra Direct Links from predefined ads.
// Kept the generic Adsterra banner and the Adsterra script ad.
const PREDEFINED_ADS: AdContent[] = [
  { adType: "url", adUrl: "https://syndication.adsterra.com/bn.php?ID=26645903&type=banner", reason: "Selected: Adsterra Generic Banner 468x60" },
  { adType: "adsterra_script", reason: "Selected: Adsterra Script Ad 728x90" }
];


export function AdContainer({ pageContext, trigger }: AdContainerProps) {
  const [ad, setAd] = useState<AdContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableAds = useMemo(() => PREDEFINED_ADS, []);

  useEffect(() => {
    function selectAd() {
      setIsLoading(true);
      setError(null);
      setAd(null);

      if (availableAds.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableAds.length);
        let selectedAd = availableAds[randomIndex];
        
        setAd(selectedAd);
      } else {
        console.warn("No predefined ads available to select.");
        setError("No ads configured for display.");
      }
      
      setTimeout(() => setIsLoading(false), 100); // Simulate a short delay for ad selection
    }

    if (trigger) {
      selectAd();
    } else {
      // If trigger is false (e.g., page changes where ad should reset), clear the ad.
      setAd(null);
      setIsLoading(false);
      setError(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, availableAds]); // Re-run when trigger or availableAds change

  if (isLoading) {
    return (
      <Card className="w-full my-4 mx-auto text-center bg-muted/50 p-2 border-dashed">
        <CardContent className="p-2">
          {/* Adjusted skeleton height to match new min-heights */}
          <Skeleton className="h-[90px] sm:h-[90px] md:h-[100px] w-full rounded-md" />
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
    )
  }

  if (!ad) {
    return null; // Don't render anything if no ad is selected (or if trigger is false)
  }

  // Additional check for URL ad type
  if (ad.adType === 'url' && !ad.adUrl) {
      return (
        <Card className="w-full my-4 mx-auto text-center bg-destructive/10 p-2 border-dashed border-destructive">
            <CardContent className="p-2 text-destructive flex flex-col items-center justify-center">
            <AlertCircle className="h-5 w-5 mb-1" />
            <p className="text-xs">Ad URL missing for URL ad type.</p>
            </CardContent>
        </Card>
      )
  }

  return (
    <Card className="w-full my-4 mx-auto text-center bg-card p-0 overflow-hidden shadow-md">
      {/* Increased min-height for mobile to 90px. Kept sm and md heights. */}
      <CardContent className="p-0 flex justify-center items-center min-h-[90px] sm:min-h-[90px] md:min-h-[100px]">
        {ad.adType === 'url' && ad.adUrl ? (
          <iframe
            src={ad.adUrl}
            frameBorder="0"
            scrolling="no"
            allowFullScreen={true}
            // Adjusted iframe height to fill the new CardContent min-heights.
            className="w-full h-[90px] sm:h-[90px] md:h-[100px]"
            title="Advertisement"
            data-ai-hint="advertisement banner"
          ></iframe>
        ) : ad.adType === 'adsterra_script' ? (
          // AdsterraScriptUnit internally defines its height as 90px
          <AdsterraScriptUnit />
        ) : (
           <div className="p-4 text-sm text-muted-foreground">Error: Could not determine ad type or ad configuration missing.</div>
        )}
      </CardContent>
    </Card>
  );
}
