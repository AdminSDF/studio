
'use client';

import { useEffect, useState, useMemo } from 'react';
import type { AdContent } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { AdsterraScriptUnit } from './adsterra-script-unit'; // 728x90
import { AdsterraScriptUnit468x60 } from './adsterra-script-unit-468x60'; // 468x60
import { AdSenseUnit } from './adsense-unit';
import { CONFIG } from '@/lib/constants';

interface AdContainerProps {
  pageContext: string;
  trigger: boolean;
}

const PLACEHOLDER_AD_SLOT = "YOUR_AD_SLOT_ID_HERE"; // Placeholder for AdSense slot

const PREDEFINED_ADS: AdContent[] = [
  { adType: "adsterra_script", reason: "Selected: Adsterra Script Ad 728x90" },
  { adType: "adsterra_script_468x60", reason: "Selected: Adsterra Script Ad 468x60" },
  { adType: "url", adUrl: "https://www.profitableratecpm.com/awkdrd8u7?key=cb1caf90ccdef2f4c51aff029a85a4f8", reason: "Selected: Adsterra Direct Link profitableratecpm" }
];

// Add AdSense ad option if client ID is configured
if (CONFIG.ADSENSE_CLIENT_ID) {
  PREDEFINED_ADS.push({
    adType: "adsense",
    adClient: CONFIG.ADSENSE_CLIENT_ID,
    adSlot: PLACEHOLDER_AD_SLOT, // Use placeholder, user needs to replace this
    reason: "Selected: Google AdSense Ad (Requires Valid Slot ID)"
  });
}


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
        
        // If AdSense is selected but client ID is missing from config (should not happen if check above works)
        if (selectedAd.adType === 'adsense' && !selectedAd.adClient) {
            console.warn("AdSense ad selected but no client ID configured in CONFIG. Skipping AdSense.");
            // Fallback to another ad or show error
            const otherAds = availableAds.filter(a => a.adType !== 'adsense');
            if (otherAds.length > 0) {
                selectedAd = otherAds[Math.floor(Math.random() * otherAds.length)];
            } else {
                setError("No suitable ads available.");
                setIsLoadingInternal(false);
                return;
            }
        }
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

  const adSlotBaseClasses = "w-full flex justify-center items-center overflow-hidden min-h-[60px] sm:min-h-[90px]";

  if (isLoadingInternal) {
    return (
      <div className={adSlotBaseClasses}>
        <div className="flex flex-col justify-center items-center text-center p-1">
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
    return <div className={adSlotBaseClasses}></div>; // Empty container if no ad is selected
  }
  
  return (
    <div className={adSlotBaseClasses}>
      {ad.adType === 'url' && ad.adUrl ? (
        <iframe
          src={ad.adUrl}
          title="Advertisement"
          className="border-0 w-full max-w-[468px] h-[60px] sm:max-w-[728px] sm:h-[90px] md:max-w-[728px] md:h-[90px]"
          style={{ display: 'block', margin: '0 auto' }}
          data-ai-hint="advertisement banner iframe"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
        ></iframe>
      ) : ad.adType === 'adsterra_script' ? (
        <AdsterraScriptUnit />
      ) : ad.adType === 'adsterra_script_468x60' ? (
        <AdsterraScriptUnit468x60 />
      ) : ad.adType === 'adsense' && ad.adClient && ad.adSlot ? (
        ad.adSlot === PLACEHOLDER_AD_SLOT ? (
            <div className="p-3 text-sm text-muted-foreground text-center bg-muted/30 rounded-md border border-dashed border-border">
                <AlertCircle className="inline-block h-4 w-4 mr-1.5 text-warning" />
                AdSense ad ready. Please replace <strong>'{PLACEHOLDER_AD_SLOT}'</strong> in AdContainer.tsx with a valid Ad Unit Slot ID from your AdSense account.
            </div>
        ) : (
            <AdSenseUnit adClient={ad.adClient} adSlot={ad.adSlot} />
        )
      ) : (
         <div className="p-2 text-sm text-muted-foreground text-center">
            Error: Could not determine ad type. Selected adType: {ad.adType}
         </div>
      )}
    </div>
  );
}
