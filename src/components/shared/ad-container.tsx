
'use client';

import { useEffect, useState, useMemo } from 'react';
import type { AdContent } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { AdsterraScriptUnit } from './adsterra-script-unit'; // 728x90
import { AdsterraScriptUnit468x60 } from './adsterra-script-unit-468x60'; // New 468x60

interface AdContainerProps {
  pageContext: string;
  trigger: boolean;
}

// Updated PREDEFINED_ADS to only include script-based ads
const PREDEFINED_ADS: AdContent[] = [
  // { adType: "url", adUrl: "https://syndication.adsterra.com/bn.php?ID=26645903&type=banner", reason: "Selected: Adsterra Generic Banner 468x60" }, // Temporarily removed
  { adType: "adsterra_script", reason: "Selected: Adsterra Script Ad 728x90" },
  { adType: "adsterra_script_468x60", reason: "Selected: Adsterra Script Ad 468x60" },
];

export function AdContainer({ pageContext, trigger }: AdContainerProps) {
  const [ad, setAd] = useState<AdContent | null>(null);
  const [isLoadingInternal, setIsLoadingInternal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize availableAds to prevent re-creation on every render if PREDEFINED_ADS was complex (though here it's simple)
  const availableAds = useMemo(() => PREDEFINED_ADS, []);

  useEffect(() => {
    function selectAd() {
      setIsLoadingInternal(true);
      setError(null);
      setAd(null); // Clear previous ad

      if (availableAds.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableAds.length);
        let selectedAd = availableAds[randomIndex];
        // console.log(`AdContainer (${pageContext}): Triggered. Selected ad:`, selectedAd);
        setAd(selectedAd);
      } else {
        console.warn("No predefined ads available to select for page context:", pageContext);
        setError("No ads configured for display.");
      }
      
      // Short delay to allow potential DOM changes for script ads before removing skeleton
      setTimeout(() => setIsLoadingInternal(false), 50); 
    }

    selectAd();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, availableAds, pageContext]); // pageContext added as a dependency, though it doesn't change ad selection logic here.

  // Root div for the ad slot. No visible container styling.
  // min-h ensures space. flex justify-center items-center for centering.
  // overflow-hidden to clip.
  const adSlotBaseClasses = "w-full flex justify-center items-center overflow-hidden min-h-[60px] sm:min-h-[90px]";

  if (isLoadingInternal) {
    return (
      <div className={adSlotBaseClasses}>
        <div className="flex flex-col justify-center items-center text-center p-1">
          {/* Skeleton now defaults to 60px height, can be pushed taller by 728x90 ad */}
          <Skeleton className="h-[60px] w-[300px] sm:h-[90px] sm:w-[468px] md:w-[728px] bg-muted/50 rounded-md mb-1" />
          <p className="text-xs text-muted-foreground">Loading ad...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={adSlotBaseClasses}>
        <div className="text-destructive p-2 text-center flex flex-col items-center justify-center">
          <AlertCircle className="h-5 w-5 mb-1" />
          <p className="text-sm font-medium">Ad Load Error</p>
          <p className="text-xs">{error}</p>
        </div>
      </div>
    )
  }

  if (!ad) {
    // console.log(`AdContainer (${pageContext}): No ad selected or available.`);
    return <div className={adSlotBaseClasses}></div>; // Render an empty placeholder matching min height
  }
  
  return (
    <div className={adSlotBaseClasses}>
      {/* Removed adType 'url' handling as it's no longer in PREDEFINED_ADS */}
      {ad.adType === 'adsterra_script' ? (
        <AdsterraScriptUnit /> // This is the 728x90 one
      ) : ad.adType === 'adsterra_script_468x60' ? (
        <AdsterraScriptUnit468x60 /> // New 468x60 script ad
      ) : (
         <div className="p-2 text-sm text-muted-foreground text-center">
            Error: Could not determine ad type or ad configuration missing. Selected adType: {ad.adType}
         </div>
      )}
    </div>
  );
}
