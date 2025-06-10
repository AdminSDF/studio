
'use client';

import { useEffect, useState, useMemo } from 'react';
import type { AdContent } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { AdsterraScriptUnit } from './adsterra-script-unit';
// AdSenseUnit and CONFIG imports are no longer needed here if AdSense is fully removed
// import { CONFIG } from '@/lib/constants';

interface AdContainerProps {
  pageContext: string;
  trigger: boolean;
}

// Predefined ads - only Adsterra options if AdSense is removed.
const PREDEFINED_ADS: AdContent[] = [
  { adType: "url", adUrl: "https://syndication.adsterra.com/bn.php?ID=26645903&type=banner", reason: "Selected: Adsterra Generic Banner 468x60" },
  { adType: "adsterra_script", reason: "Selected: Adsterra Script Ad 728x90" }
];


export function AdContainer({ pageContext, trigger }: AdContainerProps) {
  const [ad, setAd] = useState<AdContent | null>(null);
  const [isLoadingInternal, setIsLoadingInternal] = useState(false); // Renamed to avoid conflict if a prop 'isLoading' was ever introduced
  const [error, setError] = useState<string | null>(null);

  const availableAds = useMemo(() => PREDEFINED_ADS, []);

  useEffect(() => {
    function selectAd() {
      setIsLoadingInternal(true);
      setError(null);
      setAd(null);

      if (availableAds.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableAds.length);
        let selectedAd = availableAds[randomIndex];
        setAd(selectedAd);
      } else {
        console.warn("No predefined ads available to select for page context:", pageContext);
        setError("No ads configured for display.");
      }
      
      // Simulate a slight delay for ad selection logic if needed, or remove if not.
      // For purely random local selection, this might be very fast.
      setTimeout(() => setIsLoadingInternal(false), 50); 
    }

    selectAd();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, availableAds, pageContext]); 

  if (isLoadingInternal) {
    return (
      <div className="w-full flex flex-col justify-center items-center text-center bg-muted/30 p-3 border border-dashed border-border/50 rounded-lg min-h-[90px] sm:min-h-[90px] md:min-h-[100px]">
        <Skeleton className="h-[60px] w-full max-w-[728px] rounded-md mb-2" />
        <Skeleton className="h-4 w-1/3 mx-auto rounded-md" /> 
        <p className="text-xs text-muted-foreground mt-1">Loading ad...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full text-center bg-destructive/10 p-4 border border-dashed border-destructive rounded-lg text-destructive flex flex-col items-center justify-center min-h-[90px] sm:min-h-[90px] md:min-h-[100px]">
        <AlertCircle className="h-6 w-6 mb-2" />
        <p className="text-sm font-medium">Ad Load Error</p>
        <p className="text-xs">{error}</p>
      </div>
    )
  }

  if (!ad) {
    return null; 
  }

  // Specific check for URL ad type if it requires an adUrl
  if (ad.adType === 'url' && !ad.adUrl) {
      return (
        <div className="w-full text-center bg-destructive/10 p-4 border border-dashed border-destructive rounded-lg text-destructive flex flex-col items-center justify-center min-h-[90px] sm:min-h-[90px] md:min-h-[100px]">
            <AlertCircle className="h-6 w-6 mb-2" />
            <p className="text-sm font-medium">Ad Configuration Error</p>
            <p className="text-xs">Ad URL missing for URL ad type.</p>
        </div>
      )
  }
  
  // Main container for the ad content
  return (
    <div className="w-full flex justify-center items-center min-h-[90px] sm:min-h-[90px] md:min-h-[100px] overflow-hidden">
      {ad.adType === 'url' && ad.adUrl ? (
        <iframe
          src={ad.adUrl}
          frameBorder="0"
          scrolling="no"
          allowFullScreen={true}
          // The iframe itself should try to be responsive to its parent.
          // Width and height attributes here might be overridden by Adsterra's content.
          // Max-width can be useful.
          className="w-full max-w-[468px] h-[60px] sm:max-w-[728px] sm:h-[90px] md:max-w-[728px] md:h-[90px]"
          style={{ display: 'block', margin: '0 auto' }} // Center if smaller than container
          title="Advertisement"
          data-ai-hint="advertisement banner"
        ></iframe>
      ) : ad.adType === 'adsterra_script' ? (
        <AdsterraScriptUnit />
      ) : (
         <div className="p-4 text-sm text-muted-foreground text-center">Error: Could not determine ad type or ad configuration missing.</div>
      )}
    </div>
  );
}

