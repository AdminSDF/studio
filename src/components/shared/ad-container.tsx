
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

// Updated PREDEFINED_ADS with the new script ad type
const PREDEFINED_ADS: AdContent[] = [
  { adType: "url", adUrl: "https://syndication.adsterra.com/bn.php?ID=26645903&type=banner", reason: "Selected: Adsterra Generic Banner 468x60" },
  { adType: "adsterra_script", reason: "Selected: Adsterra Script Ad 728x90" },
  { adType: "adsterra_script_468x60", reason: "Selected: Adsterra Script Ad 468x60" }, // New ad type
];

export function AdContainer({ pageContext, trigger }: AdContainerProps) {
  const [ad, setAd] = useState<AdContent | null>(null);
  const [isLoadingInternal, setIsLoadingInternal] = useState(false);
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
      
      setTimeout(() => setIsLoadingInternal(false), 50); 
    }

    selectAd();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, availableAds, pageContext]); 

  // Root div for the ad slot. No visible container styling.
  // min-h ensures space. flex justify-center items-center for centering.
  // overflow-hidden to clip.
  const adSlotBaseClasses = "w-full flex justify-center items-center overflow-hidden min-h-[60px] sm:min-h-[90px]";

  if (isLoadingInternal) {
    return (
      <div className={adSlotBaseClasses}>
        <div className="flex flex-col justify-center items-center text-center p-1">
          {/* Skeleton now defaults to 60px height, can be pushed taller by 728x90 ad */}
          <Skeleton className="h-[60px] w-[300px] sm:h-[90px] sm:w-[728px] md:w-[728px] bg-muted/50 rounded-md mb-1" />
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
    return <div className={adSlotBaseClasses}></div>; 
  }

  if (ad.adType === 'url' && !ad.adUrl) {
      return (
        <div className={adSlotBaseClasses}>
            <div className="text-destructive p-2 text-center flex flex-col items-center justify-center">
                <AlertCircle className="h-5 w-5 mb-1" />
                <p className="text-sm font-medium">Ad Config Error</p>
                <p className="text-xs">Ad URL missing.</p>
            </div>
        </div>
      )
  }
  
  return (
    <div className={adSlotBaseClasses}>
      {ad.adType === 'url' && ad.adUrl ? (
        <iframe
          src={ad.adUrl}
          frameBorder="0"
          scrolling="no"
          allowFullScreen={true}
          className="max-w-[468px] w-full h-[60px] block"
          style={{ display: 'block', margin: '0 auto' }} 
          title="Advertisement Banner"
          data-ai-hint="advertisement banner"
        ></iframe>
      ) : ad.adType === 'adsterra_script' ? (
        <AdsterraScriptUnit /> // This is the 728x90 one
      ) : ad.adType === 'adsterra_script_468x60' ? (
        <AdsterraScriptUnit468x60 /> // New 468x60 script ad
      ) : (
         <div className="p-2 text-sm text-muted-foreground text-center">
            Error: Could not determine ad type or ad configuration missing.
         </div>
      )}
    </div>
  );
}
